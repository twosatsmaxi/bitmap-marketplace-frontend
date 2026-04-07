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
import {
  blockHeightSchema,
  bitmapImageQuerySchema,
  searchParamsToObject,
  validationError,
} from "../../../../../lib/validation";

export const dynamic = "force-dynamic";

const RENDER_API = process.env.RENDER_API_BASE ?? "http://r2d2.local:3020";
const DEFAULT_SIZE = 512;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ height: string }> }
): Promise<NextResponse> {
  const { height: heightStr } = await params;
  const heightNum = parseInt(heightStr, 10);

  // Validate block height
  const heightResult = blockHeightSchema.safeParse(heightNum);
  if (!heightResult.success) {
    return NextResponse.json(validationError(heightResult.error), { status: 400 });
  }
  const height = heightResult.data;

  // Parse & validate query params
  const { searchParams } = new URL(request.url);
  const qResult = bitmapImageQuerySchema.safeParse(searchParamsToObject(searchParams));
  if (!qResult.success) {
    return NextResponse.json(validationError(qResult.error), { status: 400 });
  }

  const size = qResult.data.size ?? DEFAULT_SIZE;
  const styleParam = qResult.data.style ?? null;
  const watermark = qResult.data.watermark !== "false"; // default true
  const format = qResult.data.format ?? "png";

  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  try {
    // Fetch block transaction data from upstream
    const blockDataUrl = `${RENDER_API}/api/block/${height}`;
    const response = await fetch(blockDataUrl, {
      headers: clientIp ? { 'X-Forwarded-For': clientIp } : {},
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
