import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCspConnectDomains, getCspImgDomains } from "@/lib/network-config";

const connectDomains = getCspConnectDomains().join(" ");
const imgDomains = getCspImgDomains().join(" ");

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com",
  `img-src 'self' data: blob: ${imgDomains}`,
  `connect-src 'self' ${connectDomains}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy-Report-Only": CSP_DIRECTIVES,
};

export function middleware(request: NextRequest) {
  // Apply security headers to the response
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /api/       (API routes)
     * - /_next/     (Next.js internals)
     * - /favicon.svg
     * - /og-image.png
     * - /wasm/      (WASM modules)
     */
    "/((?!api/|_next/|favicon\\.svg|og-image\\.png|wasm/).*)",
  ],
};
