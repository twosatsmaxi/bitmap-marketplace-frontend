/**
 * Dynamic Bitmap PNG Generator API (Server-Side WASM-Style)
 * 
 * GET /api/bitmap/{height}/image?size=512&style=default&watermark=true
 * 
 * Uses the same Mondrian layout engine as the browser WASM worker
 * to generate pixel-perfect transaction-based bitmap visuals.
 * 
 * Query params:
 *   - size: Output size in pixels (default: 512, max: 2048)
 *   - style: Preset style (default|twitter|square)
 *   - watermark: Show block height and tx count (default: true)
 *   - format: Response format (png|base64) - default: png
 */

import { NextRequest, NextResponse } from "next/server";
import { generateBitmapPng, generateStyledBitmap } from "../../../../../lib/serverBitmapRender";

export const dynamic = "force-dynamic";

const RENDER_API = process.env.RENDER_API_BASE ?? "http://r2d2.local:3020";
const MAX_SIZE = 2048;
const DEFAULT_SIZE = 512;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ height: string }> }
): Promise<NextResponse> {
  const { height: heightStr } = await params;
  const height = parseInt(heightStr, 10);

  if (isNaN(height) || height < 0) {
    return NextResponse.json(
      { error: "Invalid block height" },
      { status: 400 }
    );
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  
  const sizeParam = searchParams.get("size");
  const size = Math.min(
    MAX_SIZE,
    Math.max(64, parseInt(sizeParam || String(DEFAULT_SIZE), 10) || DEFAULT_SIZE)
  );

  const styleParam = searchParams.get("style") as "default" | "twitter" | "square" | null;
  const watermark = searchParams.get("watermark") !== "false"; // default true
  const format = searchParams.get("format") || "png";

  try {
    // Fetch block transaction data from upstream
    const blockDataUrl = `${RENDER_API}/api/block/${height}`;
    const response = await fetch(blockDataUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Block not found" },
          { status: 404 }
        );
      }
      throw new Error(`Upstream error: ${response.status}`);
    }

    // Get binary transaction data
    const blockBuffer = await response.arrayBuffer();

    // Generate PNG using server-side renderer (same layout as WASM worker)
    let pngBuffer: Buffer;
    
    if (styleParam && styleParam !== "default") {
      pngBuffer = generateStyledBitmap(blockBuffer, height, styleParam);
    } else {
      pngBuffer = generateBitmapPng(blockBuffer, height, {
        size,
        watermark,
      });
    }

    // Return base64 if requested
    if (format === "base64") {
      const base64 = pngBuffer.toString("base64");
      return NextResponse.json(
        { 
          height,
          size: pngBuffer.length,
          base64: `data:image/png;base64,${base64}`,
        },
        { 
          status: 200,
          headers: {
            "Cache-Control": "public, max-age=86400, immutable",
          },
        }
      );
    }

    // Return PNG image
    return new NextResponse(Buffer.from(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Disposition": `inline; filename="bitmap-${height}.png"`,
        "X-Block-Height": heightStr,
        "X-Block-Tx-Count": String(new Uint8Array(blockBuffer).length),
      },
    });

  } catch (error) {
    console.error("Bitmap generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate bitmap image" },
      { status: 502 }
    );
  }
}
