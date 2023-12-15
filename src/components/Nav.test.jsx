import React from "react";
import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import Nav from "./Nav.jsx";

describe("<Nav>", () => {
  test("renders expected HTML", async () => {
    expect(render(<Nav />)).toMatchSnapshot();
  });
});
