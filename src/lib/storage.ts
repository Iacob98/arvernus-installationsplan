import * as Minio from "minio";

const globalForMinio = globalThis as unknown as {
  minio: Minio.Client | undefined;
};

export const storage =
  globalForMinio.minio ??
  new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin_secret",
  });

if (process.env.NODE_ENV !== "production") globalForMinio.minio = storage;

const BUCKET = process.env.MINIO_BUCKET || "installationsplan";

export async function ensureBucket() {
  const exists = await storage.bucketExists(BUCKET);
  if (!exists) {
    await storage.makeBucket(BUCKET);
  }
}

export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucket();
  await storage.putObject(BUCKET, path, buffer, buffer.length, {
    "Content-Type": contentType,
  });
  return path;
}

export async function getFileUrl(path: string): Promise<string> {
  return await storage.presignedGetObject(BUCKET, path, 60 * 60);
}

export async function getFileBuffer(path: string): Promise<Buffer> {
  const stream = await storage.getObject(BUCKET, path);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(path: string): Promise<void> {
  await storage.removeObject(BUCKET, path);
}
