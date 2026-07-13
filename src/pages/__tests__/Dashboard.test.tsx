import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";

// Mock the hooks used by Dashboard
vi.mock("@/hooks/useSimulatedLoading", () => ({
  useSimulatedLoading: vi.fn(),
}));

vi.mock("@/hooks/useReporting", () => ({
  useDashboardStats: vi.fn(),
  useMonthlyTrends: vi.fn(),
}));

vi.mock("@/config/currency", () => ({
  CURRENCY: "TND",
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      createElement("div", { "data-testid": props["data-testid"] }, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
}));

// Mock recharts to avoid rendering issues
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-testid": "responsive-container" }, children),
  BarChart: () => createElement("div", { "data-testid": "bar-chart" }),
  Bar: () => null,
  AreaChart: () => createElement("div", { "data-testid": "area-chart" }),
  Area: () => null,
  PieChart: () => createElement("div", { "data-testid": "pie-chart" }),
  Pie: () => null,
  Cell: () => null,
  RadialBarChart: () => createElement("div", { "data-testid": "radial-bar-chart" }),
  RadialBar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { useDashboardStats, useMonthlyTrends } from "@/hooks/useReporting";

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, null, createElement(Dashboard))
    )
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardStats).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useDashboardStats>);
    vi.mocked(useMonthlyTrends).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useMonthlyTrends>);
  });

  it("should show loading skeleton when loading", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(true);

    renderDashboard();

    // DashboardSkeleton should be visible (loading state)
    // The component returns <DashboardSkeleton /> when loading=true
    expect(screen.queryByText("Tableau de bord")).not.toBeInTheDocument();
  });

  it("should render without crashing when not loading", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(false);

    renderDashboard();

    expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
  });

  it("should display stat cards with default values", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(false);

    renderDashboard();

    expect(screen.getByText("Total Élèves")).toBeInTheDocument();
    expect(screen.getByText("Enseignants")).toBeInTheDocument();
    expect(screen.getByText("Taux de présence")).toBeInTheDocument();
    expect(screen.getByText("Revenus")).toBeInTheDocument();
  });

  it("should display static student values when no API data", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(false);

    renderDashboard();

    // Static default values
    expect(screen.getByText("1,247")).toBeInTheDocument();
    expect(screen.getByText("96")).toBeInTheDocument();
    expect(screen.getByText("94.2%")).toBeInTheDocument();
  });

  it("should display welcome banner with school name", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(false);

    renderDashboard();

    expect(screen.getByText("Bonjour, Administrateur")).toBeInTheDocument();
  });

  it("should display upcoming events section", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(false);

    renderDashboard();

    expect(screen.getByText("Événements à venir")).toBeInTheDocument();
    expect(screen.getByText("Conseil de classe - 3ème année")).toBeInTheDocument();
  });

  it("should display recent students table", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(false);

    renderDashboard();

    expect(screen.getByText("Dernières inscriptions")).toBeInTheDocument();
    expect(screen.getByText("Amira Benali")).toBeInTheDocument();
  });

  it("should use dynamic stats when dashboard data is available", () => {
    vi.mocked(useSimulatedLoading).mockReturnValue(false);
    vi.mocked(useDashboardStats).mockReturnValue({
      data: {
        totalStudents: 500,
        totalTeachers: 50,
        tauxAbsence: 5.0,
        totalRevenue: 150000,
        moyenneGenerale: 14.2,
      },
      isLoading: false,
    } as ReturnType<typeof useDashboardStats>);

    renderDashboard();

    // Dynamic values should override static ones
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("95.0%")).toBeInTheDocument();
    expect(screen.getByText("150K TND")).toBeInTheDocument();
  });
});
