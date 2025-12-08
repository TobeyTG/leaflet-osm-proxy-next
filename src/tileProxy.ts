import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

interface TileParams {
  z: string;
  x: string;
  y: string;
}

interface ProxyOptions {
  /**
   * The User-Agent string to send to OSM.
   * REQUIRED by OSM policy. Should include app name and contact info.
   * @example "MyApp/1.0 (contact@example.com)"
   */
  userAgent: string;
  /**
   * Directory to store cached tiles. Defaults to "tile-cache" in process.cwd().
   */
  cacheFolder?: string;
}

export function createTileProxyHandler(options: ProxyOptions) {
  const CACHE_ROOT = path.join(process.cwd(), options.cacheFolder || "tile-cache");
  const UA = options.userAgent || "LeafletOSMProxy/1.0";

  return async function GET(_req: Request, { params }: { params: Promise<TileParams> }) {
    const { z, x, y: yRaw } = await params;
    const y = yRaw.replace(/\.png$/i, "");

    if ([z, x, y].some((p) => p.includes("..") || !/^\d+$/.test(p))) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const cacheDir = path.join(CACHE_ROOT, z, x);
    const cacheFile = path.join(cacheDir, `${y}.png`);

    try {
      const data = await readFile(cacheFile);
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error("Cache read error:", err);
      }
      }

      const upstreamUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      const upstreamRes = await fetch(upstreamUrl, {
        headers: { "User-Agent": UA },
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
