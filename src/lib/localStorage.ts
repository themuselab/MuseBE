import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");

function ensureUploadRoot(rel: string): string {
  const abs = path.join(UPLOAD_ROOT, rel);
  if (!abs.startsWith(UPLOAD_ROOT)) {
    throw new Error("invalid upload path");
  }
  return abs;
}

export async function saveBuffer(
  relativePath: string,
  buffer: Buffer,
): Promise<string> {
  const abs = ensureUploadRoot(relativePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, buffer);
  return getPublicUrl(relativePath);
}

export async function downloadToFile(
  url: string,
  relativePath: string,
): Promise<string> {
  const abs = ensureUploadRoot(relativePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });

  const buffer = await fetchAsBuffer(url);
  await fs.writeFile(abs, buffer);
  return getPublicUrl(relativePath);
}

export function getPublicUrl(relativePath: string): string {
  const cleaned = relativePath.split(path.sep).join("/").replace(/^\/+/, "");
  return `/uploads/${cleaned}`;
}

export function getAbsolutePath(relativePath: string): string {
  return ensureUploadRoot(relativePath);
}

function fetchAsBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`download failed: ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}
