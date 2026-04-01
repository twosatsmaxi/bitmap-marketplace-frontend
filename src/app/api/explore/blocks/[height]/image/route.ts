/**
 * Bitmap Block Image Proxy API
 * 
 * Proxies to bitmap-render backend with optional enhancements:
 * - Resize (width/height query params)
 * - Add watermark/text overlay
 * - Convert to different formats
 * - Add caching layer
 * 
 * GET /api/explore/blocks/{height}/image?width=1200&height=630&watermark=true
 */

import { NextRequest, NextResponse } from "next/server";

const RENDER_API = process.env.RENDER_API_BASE ?? "http://192.168.1.104:3020";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ height: string }> }
) {
  const { height: heightStr } = await params;
  const height = parseInt(heightStr, 10);

  if (isNaN(height) || height < 0) {
    return NextResponse.json(
      { error: "Invalid block height" },
      { status: 400 }
    );
  }

  // Parse optional query params
  const { searchParams } = new URL(request.url);
  const width = parseInt(searchParams.get("width") || "1200", 10);
  const height_px = parseInt(searchParams.get("height") || "630", 10);
  const watermark = searchParams.get("watermark") === "true";

  try {
    // Fetch PNG from bitmap-render backend
    const pngUrl = `${RENDER_API}/api/block/${height}/png`;
    const response = await fetch(pngUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Block not found or not yet seeded" },
          { status: 404 }
        );
      }
      throw new Error(`Upstream error: ${response.status}`);
    }

    // Get the PNG buffer
    const pngBuffer = await response.arrayBuffer();

    // For now, return as-is. Future: process with Sharp for resize/watermark
    // const sharp = require('sharp');
    // const processed = await sharp(Buffer.from(pngBuffer))
    //   .resize(width, height_px, { fit: 'inside' })
    //   .toBuffer();

    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Disposition": `inline; filename="bitmap-${height}.png"`,
        "X-Block-Height": heightStr,
      },
    });
  } catch (error) {
    console.error("Failed to fetch block image:", error);
    return NextResponse.json(
      { error: "Failed to generate block image" },
      { status: 502 }
    );
  }
}
