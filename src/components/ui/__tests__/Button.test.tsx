import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "@/components/ui/Button";

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("spreads ...rest props (no default type attribute)", () => {
    const { container } = render(<Button>Go</Button>);
    const btn = container.querySelector("button")!;
    // forwardRef spreads ...rest but does not set type explicitly
    expect(btn.getAttribute("type")).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Variants
  // ---------------------------------------------------------------------------
  describe("variants", () => {
    it("applies primary classes by default", () => {
      render(<Button>Primary</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-primary");
    });

    it("applies secondary classes", () => {
      render(<Button variant="secondary">Sec</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-zinc-800");
    });

    it("applies ghost classes", () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-transparent");
    });

    it("applies danger classes", () => {
      render(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-red-500/10");
    });
  });

  // ---------------------------------------------------------------------------
  // Sizes
  // ---------------------------------------------------------------------------
  describe("sizes", () => {
    it("applies md (default) padding", () => {
      render(<Button>Md</Button>);
      expect(screen.getByRole("button")).toHaveClass("px-4");
    });

    it("applies sm padding", () => {
      render(<Button size="sm">Sm</Button>);
      expect(screen.getByRole("button")).toHaveClass("px-3");
    });

    it("applies lg padding", () => {
      render(<Button size="lg">Lg</Button>);
      expect(screen.getByRole("button")).toHaveClass("px-6");
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled
  // ---------------------------------------------------------------------------
  it("disables the button when disabled prop is set", () => {
    render(<Button disabled>Off</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  describe("loading", () => {
    it("shows a spinner and disables the button", () => {
      render(<Button loading>Loading</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();

      // spinner is an aria-hidden span with animate-spin
      const spinner = btn.querySelector("span[aria-hidden='true']");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("animate-spin");
    });
  });

  // ---------------------------------------------------------------------------
  // Custom className
  // ---------------------------------------------------------------------------
  it("applies a custom className", () => {
    render(<Button className="my-custom">Styled</Button>);
    expect(screen.getByRole("button")).toHaveClass("my-custom");
  });

  // ---------------------------------------------------------------------------
  // Click handling
  // ---------------------------------------------------------------------------
  describe("click handling", () => {
    it("fires onClick handler", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Press</Button>);

      await user.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire onClick when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          No Press
        </Button>,
      );

      await user.click(screen.getByRole("button"));
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
