import { render, screen } from "@testing-library/react";
import Card from "@/components/ui/Card";

describe("Card", () => {
  // ---------------------------------------------------------------------------
  // Variants
  // ---------------------------------------------------------------------------
  describe("variants", () => {
    it("default variant has br-card class", () => {
      render(<Card>Content</Card>);
      expect(screen.getByText("Content")).toHaveClass("br-card");
    });

    it("panel variant has home-panel class", () => {
      render(<Card variant="panel">Panel</Card>);
      expect(screen.getByText("Panel")).toHaveClass("home-panel");
    });

    it("frame variant has panel-frame class", () => {
      render(<Card variant="frame">Frame</Card>);
      expect(screen.getByText("Frame")).toHaveClass("panel-frame");
    });

    it("row variant has border-b class", () => {
      render(<Card variant="row">Row</Card>);
      expect(screen.getByText("Row")).toHaveClass("border-b");
    });
  });

  // ---------------------------------------------------------------------------
  // Hover
  // ---------------------------------------------------------------------------
  it("hover prop adds transition-colors class", () => {
    render(<Card hover>Hoverable</Card>);
    expect(screen.getByText("Hoverable")).toHaveClass("transition-colors");
  });

  // ---------------------------------------------------------------------------
  // Polymorphic `as` prop
  // ---------------------------------------------------------------------------
  it('as="article" renders an <article> element', () => {
    render(
      <Card as="article">Article Card</Card>,
    );
    const el = screen.getByText("Article Card");
    expect(el.tagName).toBe("ARTICLE");
  });

  // ---------------------------------------------------------------------------
  // Children
  // ---------------------------------------------------------------------------
  it("renders children", () => {
    render(
      <Card>
        <span data-testid="child">Hello</span>
      </Card>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Custom className
  // ---------------------------------------------------------------------------
  it("applies a custom className", () => {
    render(<Card className="my-card">Styled</Card>);
    expect(screen.getByText("Styled")).toHaveClass("my-card");
  });
});
