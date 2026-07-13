import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "@/components/PrivateRoute";

// Mock useAuth hook
const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(
  initialEntries: string[] = ["/protected"]
) {
  return render(
    createElement(
      MemoryRouter,
      { initialEntries },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: "/",
          element: createElement("div", null, "Login Page"),
        }),
        createElement(Route, {
          path: "/protected",
          element: createElement(
            PrivateRoute,
            null,
            createElement("div", null, "Protected Content")
          ),
        })
      )
    )
  );
}

describe("PrivateRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading spinner when isLoading is true", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    renderWithRouter();

    // Should not show protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    // Should not redirect to login either
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should redirect to login when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithRouter();

    // Should show login page (redirected)
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    // Should not show protected content
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should render children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    renderWithRouter();

    // Should show protected content
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    // Should not show login page
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("should redirect to root path (/) when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderWithRouter();

    // The Navigate component redirects to "/" which renders "Login Page"
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("should pass through children when authenticated and loading is complete", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { container } = renderWithRouter();

    expect(container.textContent).toContain("Protected Content");
  });
});
