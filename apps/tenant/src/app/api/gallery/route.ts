import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const GALLERY_CONFIG = path.join(process.cwd(), "..", "..", "data", "gallery.json");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const raw = await readFile(GALLERY_CONFIG, "utf-8");
    const config = JSON.parse(raw);
    const result: { label: string; photos: { src: string; thumb: string }[] }[] = [];

    const cats = category && category !== "all"
      ? { [category]: config.categories[category] }
      : config.categories;

    for (const [key, cat] of Object.entries(cats) as any) {
      if (!cat) continue;
      result.push({
        label: cat.label,
        photos: cat.photos.map((p: string) => ({
          src: `/api/uploads/gallery/${p}`,
          thumb: `/api/uploads/gallery/${p}`,
        })),
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
