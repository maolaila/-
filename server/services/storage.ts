import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const maxBytes = 5 * 1024 * 1024;

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

export async function uploadProductImage(file: File) {
  if (process.env.NODE_ENV === "production" && process.env.STORAGE_DRIVER !== "supabase") {
    throw new Error("生产环境必须配置 Supabase Storage 上传");
  }

  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("图片大小必须大于 0 且不超过 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buffer);
  if (!ext) {
    throw new Error("仅支持 jpg、jpeg、png、webp 图片");
  }

  const [mainBuffer, thumbBuffer] = await Promise.all([
    toWebp(buffer, { maxWidth: 1200, quality: 80 }),
    toWebp(buffer, { maxWidth: 400, quality: 75 })
  ]);
  const assetId = crypto.randomUUID();
  const year = new Date().getFullYear();
  const storageBasePath = `products/${year}/${assetId}`;
  const mainStoragePath = `${storageBasePath}/main.webp`;
  const thumbStoragePath = `${storageBasePath}/thumb.webp`;

  if (process.env.STORAGE_DRIVER === "supabase") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase Storage 环境变量未配置");
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });
    const { error: mainError } = await client.storage.from(bucket).upload(mainStoragePath, mainBuffer, {
      contentType: "image/webp",
      upsert: false
    });
    if (mainError) {
      throw new Error(mainError.message);
    }

    const { error: thumbError } = await client.storage.from(bucket).upload(thumbStoragePath, thumbBuffer, {
      contentType: "image/webp",
      upsert: false
    });
    if (thumbError) {
      await client.storage.from(bucket).remove([mainStoragePath]).catch(() => undefined);
      throw new Error(thumbError.message);
    }

    const { data: mainData } = client.storage.from(bucket).getPublicUrl(mainStoragePath);
    const { data: thumbData } = client.storage.from(bucket).getPublicUrl(thumbStoragePath);
    return {
      url: mainData.publicUrl,
      thumbUrl: thumbData.publicUrl,
      storagePath: mainStoragePath,
      thumbStoragePath,
      contentType: "image/webp",
      originalFormat: ext,
      originalBytes: buffer.length,
      storedBytes: mainBuffer.length,
      thumbBytes: thumbBuffer.length
    };
  }

  const targetDir = path.join(process.cwd(), "public", "uploads", "products", String(year), assetId);
  await fs.mkdir(targetDir, { recursive: true });
  const mainTargetPath = path.join(targetDir, "main.webp");
  const thumbTargetPath = path.join(targetDir, "thumb.webp");
  await Promise.all([
    fs.writeFile(mainTargetPath, mainBuffer),
    fs.writeFile(thumbTargetPath, thumbBuffer)
  ]);
  const publicBasePath = `/uploads/products/${year}/${assetId}`;
  return {
    url: `${publicBasePath}/main.webp`,
    thumbUrl: `${publicBasePath}/thumb.webp`,
    storagePath: mainTargetPath,
    thumbStoragePath: thumbTargetPath,
    contentType: "image/webp",
    originalFormat: ext,
    originalBytes: buffer.length,
    storedBytes: mainBuffer.length,
    thumbBytes: thumbBuffer.length
  };
}
