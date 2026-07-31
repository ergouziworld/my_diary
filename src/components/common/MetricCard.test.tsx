// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renders the required label and value", () => {
    render(<MetricCard label="Entries" value="42" />);

    expect(screen.getByText("Entries")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("does not render a hint when omitted and renders it when provided", () => {
    const { rerender } = render(<MetricCard label="Entries" value="42" />);
    expect(screen.queryByText("Compared with last week")).not.toBeInTheDocument();

    rerender(<MetricCard label="Entries" value="42" hint="Compared with last week" />);
    expect(screen.getByText("Compared with last week")).toBeInTheDocument();
  });
});
