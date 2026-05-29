import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { createClient } from "@supabase/supabase-js";

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

export async function uploadProductImage(file: File) {
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("图片大小必须大于 0 且不超过 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImage(buffer);
  if (!ext) {
    throw new Error("仅支持 jpg、jpeg、png、webp 图片");
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `products/${new Date().getFullYear()}/${filename}`;

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
    const { error } = await client.storage.from(bucket).upload(storagePath, buffer, {
      contentType: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
      upsert: false
    });
    if (error) {
      throw new Error(error.message);
    }

    const { data } = client.storage.from(bucket).getPublicUrl(storagePath);
    return { url: data.publicUrl, storagePath };
  }

  const targetDir = path.join(process.cwd(), "public", "uploads", "products");
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, filename);
  await fs.writeFile(targetPath, buffer);
  return { url: `/uploads/products/${filename}`, storagePath: targetPath };
}
