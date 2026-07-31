// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeader } from "./SectionHeader";

describe("SectionHeader", () => {
  it("renders the required title", () => {
    render(<SectionHeader title="Mood records" />);
    expect(screen.getByRole("heading", { name: "Mood records" })).toBeInTheDocument();
  });

  it("does not render optional description or action when omitted", () => {
    render(<SectionHeader title="Mood records" />);

    expect(screen.queryByText("Track recent changes")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add record" })).not.toBeInTheDocument();
  });

  it("renders description and action when provided", () => {
    render(
      <SectionHeader
        title="Mood records"
        description="Track recent changes"
        action={<button type="button">Add record</button>}
      />,
    );

    expect(screen.getByText("Track recent changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add record" })).toBeInTheDocument();
  });
});
