import { renderHook } from "@testing-library/react";
import {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
} from "@/hooks/useMediaQuery";

// Helper: create a matchMedia mock object with the given `matches` value
function makeMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false by default (matchMedia mock returns false)", () => {
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(false);
  });

  it("returns true when matchMedia returns matches: true", () => {
    window.matchMedia = makeMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(true);
  });

  it("passes the exact query string to matchMedia", () => {
    const query = "(min-width: 500px)";
    renderHook(() => useMediaQuery(query));
    expect(window.matchMedia).toHaveBeenCalledWith(query);
  });

  it("subscribes to change events on mount", () => {
    const addEventListener = vi.fn();
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener,
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("unsubscribes from change events on unmount", () => {
    const removeEventListener = vi.fn();
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });
});

describe("useIsMobile", () => {
  it('calls matchMedia with "(max-width: 767px)"', () => {
    renderHook(() => useIsMobile());
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("returns true when matchMedia matches", () => {
    window.matchMedia = makeMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});

describe("useIsTablet", () => {
  it('calls matchMedia with "(min-width: 768px) and (max-width: 1023px)"', () => {
    renderHook(() => useIsTablet());
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(min-width: 768px) and (max-width: 1023px)"
    );
  });

  it("returns true when matchMedia matches", () => {
    window.matchMedia = makeMatchMedia(true);

    const { result } = renderHook(() => useIsTablet());
    expect(result.current).toBe(true);
  });
});

describe("useIsDesktop", () => {
  it('calls matchMedia with "(min-width: 1024px)"', () => {
    renderHook(() => useIsDesktop());
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 1024px)");
  });

  it("returns true when matchMedia matches", () => {
    window.matchMedia = makeMatchMedia(true);

    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
  });
});
