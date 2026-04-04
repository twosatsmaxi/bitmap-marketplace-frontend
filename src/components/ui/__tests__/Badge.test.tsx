import { render, screen } from "@testing-library/react";
import Badge from "@/components/ui/Badge";

describe("Badge", () => {
  // ---------------------------------------------------------------------------
  // Status variant
  // ---------------------------------------------------------------------------
  describe("status variant", () => {
    it('renders "Buy Now" for listed status', () => {
      render(<Badge variant="status" status="listed" />);
      expect(screen.getByText("Buy Now")).toBeInTheDocument();
    });

    it('renders "Has Offer" for has_offer status', () => {
      render(<Badge variant="status" status="has_offer" />);
      expect(screen.getByText("Has Offer")).toBeInTheDocument();
    });

    it("unlisted has opacity-0 class and aria-hidden", () => {
      render(<Badge variant="status" status="unlisted" />);
      const badge = screen.getByText("Unlisted");
      expect(badge).toHaveClass("opacity-0");
      expect(badge).toHaveAttribute("aria-hidden", "true");
    });

    it("uses custom children instead of default label", () => {
      render(
        <Badge variant="status" status="listed">
          Custom Label
        </Badge>,
      );
      expect(screen.getByText("Custom Label")).toBeInTheDocument();
      expect(screen.queryByText("Buy Now")).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Rarity variant
  // ---------------------------------------------------------------------------
  describe("rarity variant", () => {
    it('renders "legendary" text with shadow-glow class', () => {
      render(<Badge variant="rarity" rarity="legendary" />);
      const badge = screen.getByText("legendary");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("shadow-glow");
    });

    it('renders "common" text', () => {
      render(<Badge variant="rarity" rarity="common" />);
      expect(screen.getByText("common")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Chip variant
  // ---------------------------------------------------------------------------
  describe("chip variant", () => {
    it("active chip has bg-primary class", () => {
      render(
        <Badge variant="chip" active>
          Active
        </Badge>,
      );
      expect(screen.getByText("Active")).toHaveClass("bg-primary");
    });

    it("inactive chip has bg-[rgba(247,147,26,0.06)] class", () => {
      render(<Badge variant="chip">Inactive</Badge>);
      expect(screen.getByText("Inactive")).toHaveClass(
        "bg-[rgba(247,147,26,0.06)]",
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Tag variant
  // ---------------------------------------------------------------------------
  describe("tag variant", () => {
    it("renders children", () => {
      render(<Badge variant="tag">punk</Badge>);
      expect(screen.getByText("punk")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Soon variant
  // ---------------------------------------------------------------------------
  describe("soon variant", () => {
    it('renders "Soon" by default', () => {
      render(<Badge variant="soon" />);
      expect(screen.getByText("Soon")).toBeInTheDocument();
    });

    it("renders custom children when provided", () => {
      render(<Badge variant="soon">Coming</Badge>);
      expect(screen.getByText("Coming")).toBeInTheDocument();
      expect(screen.queryByText("Soon")).not.toBeInTheDocument();
    });
  });
});
