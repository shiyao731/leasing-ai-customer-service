import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "..", "..", "data", "uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    await mkdir(UPLOAD_DIR, { recursive: true });

    const savedPaths: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);
      savedPaths.push(`/api/uploads/${filename}`);
    }

    return NextResponse.json({ success: true, paths: savedPaths });
  } catch (error: any) {
    return NextResponse.json(
      { error: "上传失败", detail: error.message },
      { status: 500 }
    );
  }
}
