import "@testing-library/jest-dom/vitest";

// Guard all browser-only mocks — API route tests run in Node (no window/navigator)
if (typeof window !== "undefined") {

// matchMedia mock (happy-dom has limited support)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver stub
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// Clipboard mock — use configurable so userEvent can redefine it
Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
    read: vi.fn().mockResolvedValue([]),
  },
});

} // end window guard
