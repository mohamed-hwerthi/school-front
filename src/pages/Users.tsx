import { useState, useMemo, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { validate, type FormErrors } from "@/lib/validate";
import { createUserSchema, editUserSchema } from "@/lib/user-schema";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Loader2,
  ShieldCheck,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useUsersPaged,
  useAllUsers,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
  useDeleteUser,
} from "@/hooks/useUsers";
import type { UserItem, CreateUserRequest } from "@/types/user";
import type { UserRole } from "@/types/auth";

const ITEMS_PER_PAGE = 20;

const ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "DIRECTEUR",
  "ENSEIGNANT",
  "COMPTABLE",
  "PARENT",
];

/** Which roles each role may create — mirrors the backend account hierarchy. */
const CREATABLE_ROLES: Record<UserRole, UserRole[]> = {
  SUPER_ADMIN: ["SUPER_ADMIN", "ADMIN", "DIRECTEUR", "ENSEIGNANT", "COMPTABLE", "PARENT"],
  ADMIN: ["DIRECTEUR", "ENSEIGNANT", "COMPTABLE", "PARENT"],
  DIRECTEUR: ["ENSEIGNANT", "PARENT"],
  ENSEIGNANT: [],
  COMPTABLE: [],
  PARENT: [],
};

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-purple-100 text-purple-700",
  DIRECTEUR: "bg-blue-100 text-blue-700",
  ENSEIGNANT: "bg-emerald-100 text-emerald-700",
  COMPTABLE: "bg-orange-100 text-orange-700",
  PARENT: "bg-cyan-100 text-cyan-700",
};

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const emptyForm: CreateUserRequest = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "ENSEIGNANT",
};

export default function UsersPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Roles the current user is allowed to create (account hierarchy).
  const assignableRoles = user ? CREATABLE_ROLES[user.role] ?? [] : [];

  const ROLE_LABELS: Record<UserRole, string> = useMemo(() => ({
    SUPER_ADMIN: t("users.roles.superAdmin"),
    ADMIN: t("users.roles.admin"),
    DIRECTEUR: t("users.roles.director"),
    ENSEIGNANT: t("users.roles.teacher"),
    COMPTABLE: t("users.roles.accountant"),
    PARENT: t("users.roles.parent"),
  }), [t]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);

  const { data: pagedData, isLoading, isFetching } = useUsersPaged({
    page: currentPage,
    size: ITEMS_PER_PAGE,
    search: search || undefined,
    role: filterRole !== "all" ? filterRole : undefined,
  });

  const { data: allUsers = [] } = useAllUsers();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const toggleMutation = useToggleUserActive();
  const deleteMutation = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [form, setForm] = useState<CreateUserRequest>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  // Reactive validation: once a save has been attempted, re-check on every keystroke.
  useEffect(() => {
    if (!showErrors) return;
    const result = validate(editTarget ? editUserSchema : createUserSchema, form);
    setFormErrors(result.ok ? {} : result.errors);
  }, [form, showErrors, editTarget]);

  const users = pagedData?.content ?? [];
  const totalElements = pagedData?.totalElements ?? 0;
  const totalPages = pagedData?.totalPages ?? 1;

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  const stats = [
    { label: t("users.totalUsers"), value: totalUsers, color: "bg-blue-50", textColor: "text-blue-700" },
    { label: t("common.active"), value: activeUsers, color: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: t("common.inactive"), value: inactiveUsers, color: "bg-red-50", textColor: "text-red-700" },
  ];

  const hasFilters = search || filterRole !== "all";

  const resetFilters = () => {
    setSearch("");
    setFilterRole("all");
    setCurrentPage(0);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowErrors(false);
    setFormOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setEditTarget(user);
    setForm({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    setFormErrors({});
    setShowErrors(false);
    setFormOpen(true);
  };

  const handleSave = () => {
    setShowErrors(true);
    const schema = editTarget ? editUserSchema : createUserSchema;
    const result = validate(schema, form);
    if (!result.ok) { setFormErrors(result.errors); return; }
    setFormErrors({});
    const onError = (err: Error & { response?: { data?: { message?: string } } }) => {
      const status = (err as Error & { response?: { status?: number } }).response?.status;
      const msg = err.response?.data?.message ?? "Erreur lors de l'enregistrement";
      if (status === 409) setFormErrors({ email: msg });
      else setFormErrors({ _root: msg });
    };
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, data: form },
        { onSuccess: () => setFormOpen(false), onError }
      );
    } else {
      createMutation.mutate(form, { onSuccess: () => setFormOpen(false), onError });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const getInitials = (u: UserItem) =>
    `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase();
  const getAvatarColor = (id: string) => avatarColors[id % avatarColors.length];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            {t("users.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("users.subtitle")}
          </p>
        </div>
        <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-btn" onClick={openCreate}>
          <UserPlus className="h-4 w-4" />
          {t("users.newUser")}
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
              <Users className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
              placeholder={t("users.searchPlaceholder")}
              className="ps-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setCurrentPage(0); }}>
              <SelectTrigger className="w-[170px]">
                <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("users.allRoles")}</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
                {t("common.reset")}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
          {totalElements} {t("common.found")}
          {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Utilisateur</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Role</th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">Statut</th>
                <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{t("users.noUser")}</p>
                    <p className="text-xs mt-1">{t("common.tryModifyFilters")}</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`text-xs font-semibold ${getAvatarColor(user.id)}`}>
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {user.isActive ? t("common.active") : t("common.inactive")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-600" onClick={() => openEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 text-muted-foreground ${user.isActive ? "hover:text-orange-600" : "hover:text-emerald-600"}`}
                          onClick={() => toggleMutation.mutate(user.id)}
                        >
                          {user.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => setDeleteTarget(user)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            <Edit className="h-4 w-4 me-2" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleMutation.mutate(user.id)}>
                            {user.isActive ? <ShieldOff className="h-4 w-4 me-2" /> : <ShieldCheck className="h-4 w-4 me-2" />}
                            {user.isActive ? t("common.deactivate") : t("common.activate")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(user)} className="text-red-600">
                            <Trash2 className="h-4 w-4 me-2" /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">{t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) pageNum = i;
                else if (currentPage < 4) pageNum = i;
                else if (currentPage > totalPages - 5) pageNum = totalPages - 7 + i;
                else pageNum = currentPage - 3 + i;
                return (
                  <Button key={pageNum} variant={pageNum === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(pageNum)}>
                    {pageNum + 1}
                  </Button>
                );
              })}
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? t("users.editUser") : t("users.newUser")}</DialogTitle>
            <DialogDescription>
              {editTarget ? t("users.editInfo") : t("users.fillInfo")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">{t("common.firstName")}</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">{t("common.lastName")}</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>
            {!editTarget && (
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("common.password")}</Label>
                <Input id="password" type="password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                {formErrors.password
                  ? <p className="text-xs text-destructive">{formErrors.password}</p>
                  : <p className="text-xs text-muted-foreground">8 caractères min., avec au moins une majuscule, une minuscule et un chiffre.</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t("common.role")}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-xs text-destructive">{formErrors.role}</p>}
            </div>
            {formErrors._root && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formErrors._root}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("common.deleteConfirmMsg")}{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.firstName} {deleteTarget?.lastName}
              </span>{" "}
              ? {t("common.irreversible")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
