import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RoleGuard } from "@/components/RoleGuard";

// ── Mock useAuth ────────────────────────────────────────────────────────────────
const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithGuard(roles: string[], initialEntry = "/guarded") {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/guarded",
          element: createElement(
            RoleGuard,
            { roles } as any,
            createElement("div", null, "Protected Content")
          ),
        }),
        createElement(Route, {
          path: "/forbidden",
          element: createElement("div", null, "Forbidden Page"),
        })
      )
    )
  );
}

describe("RoleGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when user has correct role", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "admin@school.com",
        role: "ADMIN",
        firstName: "Admin",
        lastName: "User",
        tenantId: "school1",
        isActive: true,
      },
    });

    renderWithGuard(["ADMIN", "DIRECTEUR"]);

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Forbidden Page")).not.toBeInTheDocument();
  });

  it("redirects to /forbidden when user has wrong role", () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 2,
        email: "parent@school.com",
        role: "PARENT",
        firstName: "Parent",
        lastName: "User",
        tenantId: "school1",
        isActive: true,
      },
    });

    renderWithGuard(["ADMIN", "DIRECTEUR"]);

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();
  });

  it("redirects when user is null", () => {
    mockUseAuth.mockReturnValue({
      user: null,
    });

    renderWithGuard(["ADMIN"]);

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();
  });
});
