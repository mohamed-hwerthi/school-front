import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import React from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Teacher } from "@/types/teacher";
import { MOCK_TEACHERS } from "@/data/teachers";
import { teachersApi } from "@/api/teachers.api";
import env from "@/config/env";
import { notify } from "@/lib/toast";

const QUERY_KEY = ["teachers"];

interface TeachersContextValue {
  teachers: Teacher[];
  isLoading: boolean;
  addTeacher: (teacher: Omit<Teacher, "id" | "dateEmbauche">) => void;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  getTeacher: (id: string) => Teacher | undefined;
  importTeachers: (newTeachers: Omit<Teacher, "id" | "dateEmbauche">[]) => void;
}

const TeachersContext = createContext<TeachersContextValue | null>(null);

// ─── Mock provider (VITE_ENABLE_MOCK=true) ──────────────────
function MockTeachersProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);

  const addTeacher = useCallback(
    (data: Omit<Teacher, "id" | "dateEmbauche">) => {
      setTeachers((prev) => {
        const id = prev.length > 0 ? Math.max(...prev.map((t) => t.id)) + 1 : 1;
        const newTeacher: Teacher = {
          ...data,
          id,
          dateEmbauche: new Date().toISOString().split("T")[0],
        };
        return [newTeacher, ...prev];
      });
    },
    []
  );

  const updateTeacher = useCallback((id: string, data: Partial<Teacher>) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? ({ ...t, ...data } as Teacher) : t))
    );
  }, []);

  const deleteTeacher = useCallback((id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTeacher = useCallback(
    (id: string) => teachers.find((t) => t.id === id),
    [teachers]
  );

  const importTeachers = useCallback(
    (newTeachers: Omit<Teacher, "id" | "dateEmbauche">[]) => {
      setTeachers((prev) => {
        let nextId = prev.length > 0 ? Math.max(...prev.map((t) => t.id)) + 1 : 1;
        const today = new Date().toISOString().split("T")[0];
        const toAdd: Teacher[] = newTeachers.map((t) => ({
          ...t,
          id: nextId++,
          dateEmbauche: today,
        }));
        return [...toAdd, ...prev];
      });
    },
    []
  );

  const value: TeachersContextValue = {
    teachers,
    isLoading: false,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacher,
    importTeachers,
  };

  return React.createElement(TeachersContext.Provider, { value }, children);
}

// ─── API provider (VITE_ENABLE_MOCK=false) ──────────────────
function ApiTeachersProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: teachersApi.getAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: teachersApi.create,
    onSuccess: () => {
      invalidate();
      notify.success("Enseignant ajouté");
    },
    onError: (err: Error) => notify.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Teacher> }) =>
      teachersApi.update(id, data),
    onSuccess: () => {
      invalidate();
      notify.success("Enseignant modifié");
    },
    onError: (err: Error) => notify.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: teachersApi.delete,
    onSuccess: () => {
      invalidate();
      notify.success("Enseignant supprimé");
    },
    onError: (err: Error) => notify.error(err.message),
  });

  const importMutation = useMutation({
    mutationFn: teachersApi.importBulk,
    onSuccess: (result) => {
      invalidate();
      notify.success(`${result.length} enseignant(s) importé(s)`);
    },
    onError: (err: Error) => notify.error(err.message),
  });

  const addTeacher = useCallback(
    (data: Omit<Teacher, "id" | "dateEmbauche">) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  const updateTeacher = useCallback(
    (id: string, data: Partial<Teacher>) => {
      updateMutation.mutate({ id, data });
    },
    [updateMutation]
  );

  const deleteTeacher = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const getTeacher = useCallback(
    (id: string) => teachers.find((t) => t.id === id),
    [teachers]
  );

  const importTeachers = useCallback(
    (newTeachers: Omit<Teacher, "id" | "dateEmbauche">[]) => {
      importMutation.mutate(newTeachers);
    },
    [importMutation]
  );

  const value: TeachersContextValue = {
    teachers,
    isLoading,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacher,
    importTeachers,
  };

  return React.createElement(TeachersContext.Provider, { value }, children);
}

// ─── Exported provider (auto-selects mock vs API) ───────────
export function TeachersProvider({ children }: { children: ReactNode }) {
  if (env.ENABLE_MOCK) {
    return React.createElement(MockTeachersProvider, null, children);
  }
  return React.createElement(ApiTeachersProvider, null, children);
}

export function useTeachers() {
  const ctx = useContext(TeachersContext);
  if (!ctx) {
    throw new Error("useTeachers must be used within a TeachersProvider");
  }
  return ctx;
}
