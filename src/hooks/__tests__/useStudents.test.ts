import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStudentsPaged, useStudent, useCreateStudent, useAllStudents } from "@/hooks/useStudents";
import { studentsApi } from "@/api/students.api";
import type { Student } from "@/types/student";

// Mock the students API
vi.mock("@/api/students.api", () => ({
  studentsApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    importBulk: vi.fn(),
  },
}));

const mockStudent: Student = {
  id: 1,
  nom: "Benali",
  prenom: "Ahmed",
  nomAr: "بن علي",
  prenomAr: "أحمد",
  classe: "3A",
  niveau: "3ème année",
  sexe: "M",
  dateNaissance: "2015-09-15",
  lieuNaissance: "Tunis",
  adresse: "10 Rue de la Liberté",
  matricule: "ELV-2026-00001",
  dateInscription: "2025-09-01",
  statut: "Actif",
  estBloque: false,
  nomParent: "Benali",
  prenomParent: "Mohamed",
  telephoneParent: "06123456",
  emailParent: "parent@email.com",
};

const mockPagedResult = {
  content: [mockStudent],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  last: true,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useStudents hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useStudentsPaged", () => {
    it("should fetch students from correct endpoint with default filters", async () => {
      vi.mocked(studentsApi.getAll).mockResolvedValue(mockPagedResult);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useStudentsPaged(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(studentsApi.getAll).toHaveBeenCalledWith({});
      expect(result.current.data?.content).toHaveLength(1);
      expect(result.current.data?.content[0].nom).toBe("Benali");
    });

    it("should pass filters to API", async () => {
      vi.mocked(studentsApi.getAll).mockResolvedValue(mockPagedResult);

      const filters = { page: 0, size: 10, search: "Ahmed", niveau: "3ème année" };
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStudentsPaged(filters), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(studentsApi.getAll).toHaveBeenCalledWith(filters);
    });

    it("should handle empty results", async () => {
      vi.mocked(studentsApi.getAll).mockResolvedValue({
        ...mockPagedResult,
        content: [],
        totalElements: 0,
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useStudentsPaged(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.content).toHaveLength(0);
      expect(result.current.data?.totalElements).toBe(0);
    });

    it("should handle API errors", async () => {
      vi.mocked(studentsApi.getAll).mockRejectedValue(new Error("Network error"));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useStudentsPaged(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAllStudents", () => {
    it("should fetch all students with large page size", async () => {
      vi.mocked(studentsApi.getAll).mockResolvedValue(mockPagedResult);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAllStudents(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(studentsApi.getAll).toHaveBeenCalledWith({ page: 0, size: 10000 });
      expect(result.current.data).toHaveLength(1);
    });
  });

  describe("useStudent", () => {
    it("should fetch a single student by ID", async () => {
      vi.mocked(studentsApi.getById).mockResolvedValue(mockStudent);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useStudent(1), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(studentsApi.getById).toHaveBeenCalledWith(1);
      expect(result.current.data?.nom).toBe("Benali");
      expect(result.current.data?.matricule).toBe("ELV-2026-00001");
    });

    it("should not fetch when ID is 0", async () => {
      const wrapper = createWrapper();
      renderHook(() => useStudent(0), { wrapper });

      // Should not call the API because enabled: id > 0
      expect(studentsApi.getById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateStudent", () => {
    it("should call studentsApi.create with correct data", async () => {
      const newStudent = { ...mockStudent, id: undefined } as unknown as Omit<Student, "id" | "dateInscription">;
      vi.mocked(studentsApi.create).mockResolvedValue(mockStudent);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateStudent(), { wrapper });

      await result.current.mutateAsync(newStudent);

      expect(studentsApi.create).toHaveBeenCalledWith(newStudent);
    });
  });
});
