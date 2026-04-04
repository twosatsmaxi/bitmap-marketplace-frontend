import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextInput, Checkbox } from "@/components/ui/Input";

// ---------------------------------------------------------------------------
// TextInput
// ---------------------------------------------------------------------------
describe("TextInput", () => {
  it("renders label text", () => {
    render(<TextInput label="Block Height" />);
    expect(screen.getByText("Block Height")).toBeInTheDocument();
  });

  it("label htmlFor matches the input id", () => {
    render(<TextInput label="Block Height" />);
    const label = screen.getByText("Block Height");
    const input = screen.getByRole("textbox");
    expect(label).toHaveAttribute("for", input.id);
  });

  it('auto-generates id from label ("Block Height" -> "block-height")', () => {
    render(<TextInput label="Block Height" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "block-height");
  });

  it("custom id overrides auto-generated id", () => {
    render(<TextInput label="Block Height" id="custom-id" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("error shows error message span", () => {
    render(<TextInput error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("error changes border to red (border-red-400)", () => {
    render(<TextInput error="Bad value" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-400");
  });

  it("icon renders in container", () => {
    const icon = <svg data-testid="search-icon" />;
    render(<TextInput icon={icon} />);
    expect(screen.getByTestId("search-icon")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------
describe("Checkbox", () => {
  it('renders with role="checkbox"', () => {
    render(<Checkbox checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("aria-checked reflects checked prop (true)", () => {
    render(<Checkbox checked onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });

  it("aria-checked reflects checked prop (false)", () => {
    render(<Checkbox checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  it("clicking calls onChange with toggled value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox checked={false} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("clicking a checked checkbox calls onChange with false", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox checked onChange={onChange} />);

    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("renders label text", () => {
    render(<Checkbox checked={false} onChange={() => {}} label="Show listed" />);
    expect(screen.getByText("Show listed")).toBeInTheDocument();
  });
});
