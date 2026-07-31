// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./Panel";

describe("Panel", () => {
  it("renders the required title and passes children through", () => {
    render(
      <Panel title="Daily overview">
        <button type="button">Open diary</button>
      </Panel>,
    );

    expect(screen.getByRole("heading", { name: "Daily overview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open diary" })).toBeInTheDocument();
  });

  it("does not render a subtitle when omitted and renders it when provided", () => {
    const { rerender } = render(<Panel title="Overview">Content</Panel>);

    expect(screen.queryByText("Optional subtitle")).not.toBeInTheDocument();

    rerender(
      <Panel title="Overview" subtitle="Optional subtitle">
        Content
      </Panel>,
    );
    expect(screen.getByText("Optional subtitle")).toBeInTheDocument();
  });
});
