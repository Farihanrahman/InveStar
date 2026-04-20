import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Fund wallet</Button>);

    expect(screen.getByRole("button", { name: "Fund wallet" })).toBeInTheDocument();
  });

  it("applies variant class names", () => {
    render(<Button variant="destructive">Delete</Button>);

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("bg-destructive");
  });
});
