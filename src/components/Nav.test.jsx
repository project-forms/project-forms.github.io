import { describe, expect, test, beforeAll, vi } from "vitest";
import { render } from "@testing-library/react";
import Nav from "./Nav.jsx";

describe("<Nav>", () => {
  // This prevents having the error of ReferenceError: ResizeObserver is not defined
  // https://github.com/jsdom/jsdom/issues/3368#issuecomment-1147970817
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {
        // do nothing
      }
      unobserve() {
        // do nothing
      }
      disconnect() {
        // do nothing
      }
    };
  });

  test("renders expected HTML when 'avatarURL' is not provided", async () => {
    const { asFragment } = render(<Nav />);
    expect(asFragment()).toMatchSnapshot();
  });

  test("renders expected HTML when 'avatarURL' is provided", async () => {
    const { asFragment } = render(
      <Nav avatarUrl={"random-avatar.png"} onLogout={vi.fn()} />
    );

    expect(asFragment()).toMatchSnapshot();
  });
});
