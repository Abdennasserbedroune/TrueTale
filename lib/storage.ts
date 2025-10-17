import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION ?? "us-east-1";
const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const publicUrl = process.env.S3_PUBLIC_URL;

const hasS3Configuration =
  Boolean(bucket) && Boolean(accessKeyId) && Boolean(secretAccessKey);

const s3Client = hasS3Configuration
  ? new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    })
  : null;

function buildS3ObjectUrl(key: string) {
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  }

  if (!bucket) {
    throw new Error("S3 bucket not configured");
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadAvatar(file: File, prefix = "avatars") {
  const extension = file.name?.split(".").pop() ?? "bin";
  const key = `${prefix}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  if (s3Client && bucket) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      }),
    );

    return buildS3ObjectUrl(key);
  }

  const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public/uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = key.replace(/\//g, "-");
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
}
