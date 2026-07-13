import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { loginSchema } from "@/lib/auth-schema";

// ── Mock useAuth ────────────────────────────────────────────────────────────────
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  login: mockLogin,
  isAuthenticated: false,
  twoFactorPending: null,
  verify2FA: vi.fn(),
  cancelTwoFactor: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// ── Mock framer-motion so it renders plain elements ─────────────────────────────
vi.mock("framer-motion", () => {
  const motionProxy = new Proxy(
    {},
    {
      get(_target, prop: string) {
        // Return a component that renders the base HTML element
        return ({ children, ...rest }: any) =>
          createElement(prop, filterDomProps(rest), children);
      },
    }
  );

  function filterDomProps(props: Record<string, unknown>) {
    const filtered: Record<string, unknown> = {};
    for (const key of Object.keys(props)) {
      if (
        !key.startsWith("while") &&
        !key.startsWith("animate") &&
        !key.startsWith("initial") &&
        !key.startsWith("transition") &&
        !key.startsWith("variants") &&
        key !== "exit" &&
        key !== "layout"
      ) {
        filtered[key] = props[key];
      }
    }
    return filtered;
  }

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: ReactNode }) => children,
  };
});

// ── Mock the hero image import ──────────────────────────────────────────────────
vi.mock("@/assets/school-hero.png", () => ({
  default: "school-hero-mock.png",
}));

// ── Lazy import after mocks are set up ──────────────────────────────────────────
async function renderLoginPage() {
  const { default: Index } = await import("@/pages/Index");
  return render(
    createElement(MemoryRouter, { initialEntries: ["/"] }, createElement(Index))
  );
}

describe("Auth flow — Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      twoFactorPending: null,
      verify2FA: vi.fn(),
      cancelTwoFactor: vi.fn(),
    });
  });

  it("renders email and password fields", async () => {
    await renderLoginPage();

    expect(screen.getByPlaceholderText("nom@ecole.fr")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("shows error on empty submission", async () => {
    await renderLoginPage();

    const submitBtn = screen.getByRole("button", { name: /se connecter/i });
    await userEvent.click(submitBtn);

    // The Zod schema should reject empty fields — error message displayed
    await waitFor(() => {
      expect(screen.getByText(/email est requis/i)).toBeInTheDocument();
    });
  });

  it("calls login API when demo button is clicked", async () => {
    mockLogin.mockResolvedValue({
      twoFactorRequired: false,
      accessToken: "token",
      refreshToken: "rt",
      tokenType: "Bearer",
      expiresIn: 900,
      user: { id: 1, email: "parent@school.dev", role: "PARENT" },
    });

    await renderLoginPage();

    // Click the Parent demo button which calls handleQuickLogin directly
    const parentBtn = screen.getByRole("button", { name: /parent/i });
    fireEvent.click(parentBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "parent@school.dev",
        password: "parent123",
      });
    });
  });

  it("Zod schema validates email format", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "pass123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/email/i);
    }
  });

  it("Zod schema rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => /mot de passe/i.test(m))).toBe(true);
    }
  });
});
