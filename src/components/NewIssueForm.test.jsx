import { describe, expect, test } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NewIssueForm from "./NewIssueForm.jsx";

describe("NewIssueForm", () => {
  test("title is required", async () => {
    const user = userEvent.setup();

    const { getByRole, getByLabelText } = render(
      <NewIssueForm
        onSubmit={() => {}}
        submittedIssueUrl=""
        projectFields={[]}
      />
    );

    const submitButton = getByRole("button", { name: "Submit new issue" });

    expect(submitButton.getAttribute("disabled")).not.toBeNull();

    await user.click(submitButton);

    const titleInput = getByLabelText("Issue title*");
    await user.type(titleInput, "Test issue title");

    expect(submitButton.getAttribute("disabled")).toBeNull();
  });
});
