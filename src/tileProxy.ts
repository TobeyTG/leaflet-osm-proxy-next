import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export function createTileProxyHandler() {
  return async function GET(_req: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
    const { z, x, y: yRaw } = await params;
    const y = yRaw.replace(/\.png$/i, "");

    if ([z, x, y].some((p) => p.includes("..") || !/^\d+$/.test(p))) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const cacheDir = path.join(process.cwd(), "tile-cache", z, x);
    const cacheFile = path.join(cacheDir, `${y}.png`);

    try {
      if (existsSync(cacheFile)) {
        const data = await readFile(cacheFile);
        return new NextResponse(data, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        });
      }

      const upstreamUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      const upstreamRes = await fetch(upstreamUrl, {
        headers: { "User-Agent": "NextjsLocalProxy/1.0" },
      });

      if (!upstreamRes.ok) {
        return new NextResponse("Tile not available", { status: upstreamRes.status });
      }

      const arrayBuffer = await upstreamRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await mkdir(cacheDir, { recursive: true });
      await writeFile(cacheFile, buffer);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, immutable",
        },
      });
    } catch (err) {
      console.error("Tile proxy error:", err);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  };
}
