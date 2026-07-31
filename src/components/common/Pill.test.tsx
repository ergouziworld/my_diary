// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pill } from "./Pill";

const toneCases = [
  ["neutral", "border-white/10 bg-slate-950/55 text-slate-300"],
  ["good", "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"],
  ["warning", "border-amber-400/20 bg-amber-400/10 text-amber-200"],
  ["accent", "border-accent-500/20 bg-accent-500/10 text-accent-300"],
] as const;

describe("Pill", () => {
  it("renders its required children", () => {
    render(<Pill>In progress</Pill>);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it.each(toneCases)("renders the %s tone with its configured classes", (tone, classNames) => {
    render(<Pill tone={tone}>{tone}</Pill>);
    const pill = screen.getByText(tone);

    for (const className of classNames.split(" ")) {
      expect(pill).toHaveClass(className);
    }
    expect(pill.className).not.toContain("undefined");
  });
});
