import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderScreen } from "~tests/support/render-screen";

import { SignInForm } from "./SignInForm";

const actions = vi.hoisted(() => ({ submit: vi.fn(async () => ({ status: "idle" as const })) }));

vi.mock("@/features/auth/actions", () => ({
  requestPasswordResetAction: actions.submit,
  resendConfirmationAction: actions.submit,
  resetPasswordAction: actions.submit,
  sendSignInLinkAction: actions.submit,
  signInWithPasswordAction: actions.submit,
  signUpAction: actions.submit,
  verifySignupCodeAction: actions.submit,
  verifySignupLinkAction: actions.submit,
}));

describe("password entry controls", () => {
  beforeEach(() => { actions.submit.mockClear(); });

  it("requires two hidden password entries when creating an account", () => {
    renderScreen(<SignInForm mode="sign-up" />);

    const password = screen.getByLabelText("Password", { exact: true });
    const confirmation = screen.getByLabelText("Confirm password", { exact: true });
    for (const field of [password, confirmation]) {
      expect(field).toHaveAttribute("type", "password");
      expect(field).toHaveAttribute("autocomplete", "new-password");
      expect(field).toBeRequired();
    }
    expect(confirmation).toHaveAttribute("name", "confirmPassword");
  });

  it("keeps sign-in to one password entry with its own visibility button", () => {
    renderScreen(<SignInForm />);

    expect(screen.getByLabelText("Password", { exact: true })).toHaveAttribute("autocomplete", "current-password");
    expect(screen.queryByLabelText(/confirm.*password/i)).toBeNull();
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute("type", "button");
  });

  it("shows passwords independently without clearing values or submitting signup", async () => {
    renderScreen(<SignInForm mode="sign-up" />);
    const user = userEvent.setup();
    const password = screen.getByLabelText("Password", { exact: true });
    const confirmation = screen.getByLabelText("Confirm password", { exact: true });
    await user.type(screen.getByLabelText("First name"), "Alex");
    await user.type(screen.getByLabelText("Email address"), "renter@example.test");
    await user.type(password, "example-password-01");
    await user.type(confirmation, "example-password-01");
    await user.click(screen.getByRole("checkbox"));
    await user.click(password);

    const showPassword = screen.getByRole("button", { name: "Show password" });
    expect(showPassword).toHaveAttribute("aria-controls", password.id);
    await user.click(showPassword);
    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveFocus();
    expect(confirmation).toHaveAttribute("type", "password");
    expect(password).toHaveValue("example-password-01");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Show confirmation password" }));
    expect(confirmation).toHaveAttribute("type", "text");
    expect(confirmation).toHaveValue("example-password-01");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "text");
    expect(actions.submit).not.toHaveBeenCalled();
  });

  it("lets keyboard users toggle either reset field without moving focus", async () => {
    renderScreen(<SignInForm mode="reset-password" />);
    const user = userEvent.setup();
    const password = screen.getByLabelText("New password", { exact: true });
    const confirmation = screen.getByLabelText("Confirm new password", { exact: true });
    const showPassword = screen.getByRole("button", { name: "Show password" });
    const showConfirmation = screen.getByRole("button", { name: "Show confirmation password" });
    showPassword.focus();
    await user.keyboard("{Enter}");
    expect(password).toHaveAttribute("type", "text");
    expect(showPassword).toHaveFocus();
    showConfirmation.focus();
    await user.keyboard(" ");
    expect(confirmation).toHaveAttribute("type", "text");
    expect(showConfirmation).toHaveFocus();
    expect(actions.submit).not.toHaveBeenCalled();
  });
});
