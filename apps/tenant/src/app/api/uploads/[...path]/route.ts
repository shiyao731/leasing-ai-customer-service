import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath = path.join(
    process.cwd(), "..", "..", "data", "uploads",
    ...params.path
  );
  try {
    const buffer = await readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png" ? "image/png" :
      ext === "gif" ? "image/gif" :
      ext === "webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
