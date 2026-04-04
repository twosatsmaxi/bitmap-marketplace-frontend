import { render, screen } from "@testing-library/react";
import {
  Spinner,
  ShimmerBar,
  Skeleton,
  PulseDots,
} from "@/components/ui/Loader";

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
describe("Spinner", () => {
  it('renders with role="status"', () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it('has aria-label="Loading"', () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
  });

  it("sm size has h-4 class", () => {
    render(<Spinner size="sm" />);
    expect(screen.getByRole("status")).toHaveClass("h-4");
  });

  it("lg size has h-10 class", () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole("status")).toHaveClass("h-10");
  });
});

// ---------------------------------------------------------------------------
// ShimmerBar
// ---------------------------------------------------------------------------
describe("ShimmerBar", () => {
  it('renders with role="status"', () => {
    render(<ShimmerBar />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
describe("Skeleton", () => {
  it("renders with animate-pulse class", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status")).toHaveClass("animate-pulse");
  });

  it("renders children", () => {
    render(
      <Skeleton>
        <span data-testid="inner">placeholder</span>
      </Skeleton>,
    );
    expect(screen.getByTestId("inner")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// PulseDots
// ---------------------------------------------------------------------------
describe("PulseDots", () => {
  it("renders 3 dot elements", () => {
    const { container } = render(<PulseDots />);
    const dots = container.querySelectorAll("span.animate-pulse");
    expect(dots).toHaveLength(3);
  });

  it('has role="status"', () => {
    render(<PulseDots />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
