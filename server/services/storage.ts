import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import WebSocket from "ws";

const maxBytes = 5 * 1024 * 1024;
const imageCacheControl = "public, max-age=31536000, immutable";
const storageDrivers = ["local", "supabase", "r2"] as const;
const webSocketTransport = WebSocket as unknown as typeof globalThis.WebSocket;

type StorageDriver = (typeof storageDrivers)[number];
type ProductImageUploadUsage = "thumbnail" | "detail";

const signatures = {
  jpg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47]],
  webp: [[0x52, 0x49, 0x46, 0x46]]
};

function detectImage(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (signatures.jpg.some((bytes) => bytes.every((byte, index) => buffer[index] === byte))) {
    return "jpg";
  }
  if (signatures.png.some((bytes) => bytes.every((byte, index) => buffer[index] === byte))) {
    return "png";
  }
  if (
    signatures.webp.some((bytes) => bytes.every((byte, index) => buffer[index] === byte)) &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function requireStorageEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} 环境变量未配置`);
  }
  return value;
}

function getStorageDriver(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER?.trim() || "local";
  if (storageDrivers.includes(driver as StorageDriver)) {
    return driver as StorageDriver;
  }
  throw new Error(`不支持的 STORAGE_DRIVER：${driver}`);
}

function getR2Client() {
  const accountId = requireStorageEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireStorageEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireStorageEnv("R2_SECRET_ACCESS_KEY");
  const endpoint = process.env.R2_ENDPOINT?.trim() || `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

function buildPublicUrl(baseUrl: string, storagePath: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${storagePath}`;
}

async function toWebp(buffer: Buffer, options: { maxWidth: number; quality: number }) {
  try {
    return await sharp(buffer, { failOn: "warning" })
      .rotate()
      .resize({
        width: options.maxWidth,
        withoutEnlargement: true
      })
      .webp({ quality: options.quality, effort: 4 })
      .toBuffer();
  } catch {
    throw new Error("图片转换 WebP 失败，请确认文件不是损坏图片");
  }
}

export async function uploadProductImage(file: File, usage: ProductImageUploadUsage = "detail") {
  const storageDriver = getStorageDriver();
  if (process.env.NODE_ENV === "production" && storageDriver === "local") {
    throw new Error("生产环境必须配置 R2 或 Supabase Storage 上传");
  }

  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("图片大小必须大于 0 且不超过 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buffer);
  if (!ext) {
    throw new Error("仅支持 jpg、jpeg、png、webp 图片");
  }

  const isThumbnail = usage === "thumbnail";
  const webpBuffer = await toWebp(buffer, isThumbnail ? { maxWidth: 400, quality: 75 } : { maxWidth: 1200, quality: 80 });
  const assetId = crypto.randomUUID();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const storageBasePath = `products/${year}/${month}`;
  const storagePath = `${storageBasePath}/${assetId}${isThumbnail ? "-thumb" : ""}.webp`;

  if (storageDriver === "r2") {
    const client = getR2Client();
    const bucket = requireStorageEnv("R2_BUCKET");
    const publicBaseUrl = requireStorageEnv("R2_PUBLIC_BASE_URL");

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storagePath,
        Body: webpBuffer,
        ContentType: "image/webp",
        CacheControl: imageCacheControl
      })
    );

    const publicUrl = buildPublicUrl(publicBaseUrl, storagePath);
    return {
      url: publicUrl,
      detailUrl: isThumbnail ? undefined : publicUrl,
      thumbUrl: isThumbnail ? publicUrl : undefined,
      storagePath,
      detailStoragePath: isThumbnail ? undefined : storagePath,
      thumbStoragePath: isThumbnail ? storagePath : undefined,
      contentType: "image/webp",
      originalFormat: ext,
      originalBytes: buffer.length,
      storedBytes: isThumbnail ? undefined : webpBuffer.length,
      thumbBytes: isThumbnail ? webpBuffer.length : undefined
    };
  }

  if (storageDriver === "supabase") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase Storage 环境变量未配置");
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      realtime: { transport: webSocketTransport }
    });
    const { error } = await client.storage.from(bucket).upload(storagePath, webpBuffer, {
      contentType: "image/webp",
      upsert: false
    });
    if (error) {
      throw new Error(error.message);
    }

    const { data } = client.storage.from(bucket).getPublicUrl(storagePath);
    return {
      url: data.publicUrl,
      detailUrl: isThumbnail ? undefined : data.publicUrl,
      thumbUrl: isThumbnail ? data.publicUrl : undefined,
      storagePath,
      detailStoragePath: isThumbnail ? undefined : storagePath,
      thumbStoragePath: isThumbnail ? storagePath : undefined,
      contentType: "image/webp",
      originalFormat: ext,
      originalBytes: buffer.length,
      storedBytes: isThumbnail ? undefined : webpBuffer.length,
      thumbBytes: isThumbnail ? webpBuffer.length : undefined
    };
  }

  const targetDir = path.join(process.cwd(), "public", "uploads", "products", String(year), month);
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, `${assetId}${isThumbnail ? "-thumb" : ""}.webp`);
  await fs.writeFile(targetPath, webpBuffer);
  const publicBasePath = `/uploads/products/${year}/${month}`;
  const publicUrl = `${publicBasePath}/${assetId}${isThumbnail ? "-thumb" : ""}.webp`;
  return {
    url: publicUrl,
    detailUrl: isThumbnail ? undefined : publicUrl,
    thumbUrl: isThumbnail ? publicUrl : undefined,
    storagePath: targetPath,
    detailStoragePath: isThumbnail ? undefined : targetPath,
    thumbStoragePath: isThumbnail ? targetPath : undefined,
    contentType: "image/webp",
    originalFormat: ext,
    originalBytes: buffer.length,
    storedBytes: isThumbnail ? undefined : webpBuffer.length,
    thumbBytes: isThumbnail ? webpBuffer.length : undefined
  };
}
