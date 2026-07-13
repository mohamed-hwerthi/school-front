import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type UserFilters, type PagedUsers } from "@/api/users.api";
import type { UserItem, CreateUserRequest } from "@/types/user";

const USERS_KEY = "users";

/**
 * Paginated + filtered users list.
 */
export function useUsersPaged(filters: UserFilters = {}) {
  return useQuery<PagedUsers>({
    queryKey: [USERS_KEY, "paged", filters],
    queryFn: () => usersApi.getAll(filters),
  });
}

/**
 * All users (unpaginated).
 */
export function useAllUsers() {
  return useQuery<UserItem[]>({
    queryKey: [USERS_KEY, "all"],
    queryFn: async () => {
      const res = await usersApi.getAll({ page: 0, size: 10000 });
      return res.content;
    },
  });
}

/**
 * Single user by ID.
 */
export function useUser(id: string) {
  return useQuery<UserItem>({
    queryKey: [USERS_KEY, id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Create user mutation.
 */
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

/**
 * Update user mutation.
 */
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateUserRequest> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

/**
 * Toggle user active status mutation.
 */
export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.toggleActive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

/**
 * Delete user mutation.
 */
export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}
