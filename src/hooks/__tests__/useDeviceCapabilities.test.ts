import { renderHook } from "@testing-library/react";
import { useDeviceCapabilities } from "@/hooks/useDeviceCapabilities";

// Helper to create a matchMedia mock that selectively matches queries
function makeMatchMedia(matchingQueries: string[]) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: matchingQueries.includes(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("useDeviceCapabilities", () => {
  // Preserve the original matchMedia set by setup.ts so we can restore it
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  describe("default (desktop, no reduced motion)", () => {
    it('returns initialQualityTier "canvas2d" since webgl2 is not supported in happy-dom', () => {
      // Default matchMedia mock returns false for everything,
      // meaning: not mobile, not tablet, not reduced-motion, not coarse pointer.
      // Since supportsWebGL2 is false in happy-dom, desktop tier falls back to "canvas2d".
      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.prefersReducedMotion).toBe(false);
      expect(result.current.initialQualityTier).toBe("canvas2d");
    });
  });

  describe("mobile device", () => {
    it("sets isMobile true and maxDpr to 2", () => {
      window.matchMedia = makeMatchMedia(["(max-width: 767px)"]);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.maxDpr).toBe(2);
    });

    it('returns initialQualityTier "canvas2d" on mobile (no webgl2)', () => {
      window.matchMedia = makeMatchMedia(["(max-width: 767px)"]);

      const { result } = renderHook(() => useDeviceCapabilities());
      expect(result.current.initialQualityTier).toBe("canvas2d");
    });
  });

  describe("tablet device", () => {
    it("sets isTablet true and maxDpr to 2.5", () => {
      window.matchMedia = makeMatchMedia([
        "(min-width: 768px) and (max-width: 1023px)",
      ]);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.maxDpr).toBe(2.5);
    });

    it('returns initialQualityTier "canvas2d" on tablet (no webgl2)', () => {
      window.matchMedia = makeMatchMedia([
        "(min-width: 768px) and (max-width: 1023px)",
      ]);

      const { result } = renderHook(() => useDeviceCapabilities());
      expect(result.current.initialQualityTier).toBe("canvas2d");
    });
  });

  describe("desktop device", () => {
    it("sets maxDpr to Infinity when neither mobile nor tablet", () => {
      // Default matchMedia returns false for all queries => desktop
      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.maxDpr).toBe(Infinity);
    });
  });

  describe("reduced motion", () => {
    it('returns initialQualityTier "static" when prefers-reduced-motion matches', () => {
      window.matchMedia = makeMatchMedia([
        "(prefers-reduced-motion: reduce)",
      ]);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.initialQualityTier).toBe("static");
    });

    it('returns "static" even on mobile when reduced motion is preferred', () => {
      window.matchMedia = makeMatchMedia([
        "(max-width: 767px)",
        "(prefers-reduced-motion: reduce)",
      ]);

      const { result } = renderHook(() => useDeviceCapabilities());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.initialQualityTier).toBe("static");
    });
  });

  describe("coarse pointer", () => {
    it("reports hasCoarsePointer true when pointer: coarse matches", () => {
      window.matchMedia = makeMatchMedia(["(pointer: coarse)"]);

      const { result } = renderHook(() => useDeviceCapabilities());
      expect(result.current.hasCoarsePointer).toBe(true);
    });

    it("reports hasCoarsePointer false by default", () => {
      const { result } = renderHook(() => useDeviceCapabilities());
      expect(result.current.hasCoarsePointer).toBe(false);
    });
  });
});
