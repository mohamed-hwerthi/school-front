import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DoorOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Monitor,
  Users,
  MoreHorizontal,
  X,
  Clock,
  CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useRooms, useDeleteRoom } from "@/hooks/useRooms";
import { MOCK_TIMESLOTS } from "@/data/rooms";
import { EmploiSallesSkeleton } from "@/components/skeletons/EmploiSallesSkeleton";
import { ROOM_TYPES, ROOM_STATUTS, JOURS, HEURES } from "@/types/room";
import type { Room, TimeSlot, Jour } from "@/types/room";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 8;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

const roomTypeIcons: Record<string, string> = {
  "Salle de classe": "bg-blue-100 text-blue-700",
  "Laboratoire": "bg-emerald-100 text-emerald-700",
  "Salle informatique": "bg-purple-100 text-purple-700",
  "Bibliothèque": "bg-amber-100 text-amber-700",
  "Salle de sport": "bg-orange-100 text-orange-700",
  "Salle polyvalente": "bg-cyan-100 text-cyan-700",
};

const statusConfig: Record<string, { bg: string; text: string }> = {
  Disponible: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Occupée: { bg: "bg-blue-100", text: "text-blue-700" },
  "En maintenance": { bg: "bg-amber-100", text: "text-amber-700" },
};

const slotColors = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-orange-50 border-orange-200 text-orange-800",
  "bg-pink-50 border-pink-200 text-pink-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-indigo-50 border-indigo-200 text-indigo-800",
  "bg-teal-50 border-teal-200 text-teal-800",
];

export default function EmploiSalles() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: rooms = [], isLoading } = useRooms();
  const deleteRoomMutation = useDeleteRoom();
  // TimeSlots still use mock data (no backend yet)
  const timeSlots = MOCK_TIMESLOTS;

  const [activeTab, setActiveTab] = useState<"salles" | "emploi">("salles");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterEtage, setFilterEtage] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Timetable filters
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedJour, setSelectedJour] = useState<Jour | "all">("all");

  // Dialog states
  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState<Room | null>(null);
  const [viewSlot, setViewSlot] = useState<TimeSlot | null>(null);

  const ETAGES = useMemo(
    () => [...new Set(rooms.map((r) => r.etage))].sort((a, b) => a - b),
    [rooms]
  );

  // ─── Derived data (Salles tab) ─────────────────────────
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchSearch =
        search === "" ||
        r.nom.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || r.type === filterType;
      const matchStatut = filterStatut === "all" || r.statut === filterStatut;
      const matchEtage = filterEtage === "all" || r.etage === Number(filterEtage);
      return matchSearch && matchType && matchStatut && matchEtage;
    });
  }, [rooms, search, filterType, filterStatut, filterEtage]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / ITEMS_PER_PAGE));
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ─── Derived data (Emploi tab) ─────────────────────────
  const filteredSlots = useMemo(() => {
    return timeSlots.filter((ts) => {
      const matchRoom = selectedRoom === "all" || ts.salleId === selectedRoom;
      const matchJour = selectedJour === "all" || ts.jour === selectedJour;
      return matchRoom && matchJour;
    });
  }, [timeSlots, selectedRoom, selectedJour]);

  // Color mapping for subjects
  const subjectColorMap = useMemo(() => {
    const subjects = [...new Set(timeSlots.map((ts) => ts.matiere))];
    const map: Record<string, string> = {};
    subjects.forEach((s, i) => {
      map[s] = slotColors[i % slotColors.length];
    });
    return map;
  }, [timeSlots]);

  // Stats
  const totalRooms = rooms.length;
  const disponibles = rooms.filter((r) => r.statut === "Disponible").length;
  const occupees = rooms.filter((r) => r.statut === "Occupée").length;
  const enMaintenance = rooms.filter((r) => r.statut === "En maintenance").length;
  const totalCapacite = rooms.reduce((sum, r) => sum + r.capacite, 0);
  const totalCreneaux = timeSlots.length;

  const stats = [
    { id: "totalRooms", label: t("rooms.totalRooms"), value: totalRooms, icon: Building2, color: "bg-blue-500", bgLight: "bg-blue-50", textColor: "text-blue-700" },
    { id: "available", label: t("rooms.availablePlural"), value: disponibles, icon: CheckCircle2, color: "bg-emerald-500", bgLight: "bg-emerald-50", textColor: "text-emerald-700" },
    { id: "active", label: t("common.active"), value: occupees, icon: Users, color: "bg-purple-500", bgLight: "bg-purple-50", textColor: "text-purple-700" },
    { id: "maintenance", label: t("schedule.maintenance"), value: enMaintenance, icon: Wrench, color: "bg-amber-500", bgLight: "bg-amber-50", textColor: "text-amber-700" },
    { id: "totalCapacity", label: t("rooms.totalCapacity"), value: totalCapacite, icon: Users, color: "bg-pink-500", bgLight: "bg-pink-50", textColor: "text-pink-700" },
    { id: "totalSlots", label: t("rooms.totalSlots"), value: totalCreneaux, icon: Clock, color: "bg-cyan-500", bgLight: "bg-cyan-50", textColor: "text-cyan-700" },
  ];

  // ─── Handlers ─────────────────────────────────────────
  const resetFilters = () => {
    setSearch("");
    setFilterType("all");
    setFilterStatut("all");
    setFilterEtage("all");
    setCurrentPage(1);
  };

  const hasFilters =
    search || filterType !== "all" || filterStatut !== "all" || filterEtage !== "all";

  const handleDeleteRoom = () => {
    if (!deleteRoomTarget) return;
    deleteRoomMutation.mutate(deleteRoomTarget.id, {
      onSuccess: () => {
        toast.success("Salle supprimée avec succès");
        setDeleteRoomTarget(null);
      },
      onError: (err) => {
        toast.error(err.message || "Erreur lors de la suppression");
      },
    });
  };

  const getRoomName = (id: string) => rooms.find((r) => r.id === id)?.nom ?? "—";

  if (isLoading) return <EmploiSallesSkeleton />;

  // ─── Render ───────────────────────────────────────────
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
            {t("rooms.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("rooms.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            {t("common.export")}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-primary shadow-btn"
            onClick={() => navigate("/dashboard/emploi-salles/ajouter")}
          >
            <Plus className="h-4 w-4" />
            {t("rooms.newRoom")}
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit"
      >
        <button
          onClick={() => setActiveTab("salles")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "salles"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DoorOpen className="h-4 w-4" />
          {t("nav.rooms")}
        </button>
        <button
          onClick={() => setActiveTab("emploi")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "emploi"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          {t("nav.schedule")}
        </button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.id}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgLight}`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.textColor}`} />
            </div>
            <p className="mt-2.5 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══════════════ SALLES TAB ═══════════════ */}
      {activeTab === "salles" && (
        <>
          {/* Filters */}
          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("rooms.searchPlaceholder")}
                  className="ps-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={filterType}
                  onValueChange={(v) => {
                    setFilterType(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[170px]">
                    <Filter className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("rooms.allTypes")}</SelectItem>
                    {ROOM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatut}
                  onValueChange={(v) => {
                    setFilterStatut(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {ROOM_STATUTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterEtage}
                  onValueChange={(v) => {
                    setFilterEtage(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Étage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {ETAGES.map((e) => (
                      <SelectItem key={e} value={String(e)}>
                        {e === 0 ? "RDC" : `Étage ${e}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("common.reset")}
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {filteredRooms.length} {t("common.found")}
            </div>
          </motion.div>

          {/* Room Table */}
          <motion.div
            custom={7}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                      {t("schedule.room")}
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden sm:table-cell">
                      {t("common.type")}
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden md:table-cell">
                      {t("transport.capacity")}
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                      {t("common.level")}
                    </th>
                    <th className="py-3 px-4 text-start text-xs font-semibold text-muted-foreground">
                      {t("common.status")}
                    </th>
                    <th className="py-3 px-4 text-end text-xs font-semibold text-muted-foreground">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRooms.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{t("rooms.roomNotFound")}</p>
                        <p className="text-xs mt-1">
                          {t("common.tryModifyFilters")}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRooms.map((room) => (
                      <tr
                        key={room.id}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                roomTypeIcons[room.type] ?? "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <DoorOpen className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{room.nom}</p>
                              <p className="text-xs text-muted-foreground">
                                {room.equipements.slice(0, 2).join(", ")}
                                {room.equipements.length > 2 && ` +${room.equipements.length - 2}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <Badge variant="outline" className="font-medium">
                            {room.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                          {room.capacite} places
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                          {room.etage === 0 ? "RDC" : `Étage ${room.etage}`}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              statusConfig[room.statut]?.bg
                            } ${statusConfig[room.statut]?.text}`}
                          >
                            {room.statut}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                              onClick={() => setViewRoom(room)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                              onClick={() =>
                                navigate(`/dashboard/emploi-salles/modifier/${room.id}`)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              onClick={() => setDeleteRoomTarget(room)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {/* Mobile dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:hidden"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewRoom(room)}>
                                  <Eye className="h-4 w-4 me-2" /> Voir
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/dashboard/emploi-salles/modifier/${room.id}`)
                                  }
                                >
                                  <Edit className="h-4 w-4 me-2" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteRoomTarget(room)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 me-2" /> Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredRooms.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ═══════════════ EMPLOI DU TEMPS TAB ═══════════════ */}
      {activeTab === "emploi" && (
        <>
          {/* Timetable Filters */}
          <motion.div
            custom={6}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-[200px]">
                  <DoorOpen className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Salle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("rooms.allRooms")}</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedJour}
                onValueChange={(v) => setSelectedJour(v as Jour | "all")}
              >
                <SelectTrigger className="w-[160px]">
                  <CalendarDays className="h-3.5 w-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Jour" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("rooms.allDays")}</SelectItem>
                  {JOURS.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(selectedRoom !== "all" || selectedJour !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRoom("all");
                    setSelectedJour("all");
                  }}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("common.reset")}
                </Button>
              )}
              <div className="sm:ms-auto text-xs text-muted-foreground">
                {filteredSlots.length} créneau{filteredSlots.length !== 1 ? "x" : ""}
              </div>
            </div>
          </motion.div>

          {/* Timetable Grid */}
          <motion.div
            custom={7}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="py-3 px-3 text-start text-xs font-semibold text-muted-foreground border-b border-r border-border sticky start-0 bg-muted/30 z-10 min-w-[80px]">
                      Heure
                    </th>
                    {(selectedJour === "all" ? JOURS : [selectedJour]).map((jour) => (
                      <th
                        key={jour}
                        className="py-3 px-3 text-center text-xs font-semibold text-muted-foreground border-b border-border min-w-[160px]"
                      >
                        {jour}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HEURES.map((heure) => {
                    const displayJours = selectedJour === "all" ? JOURS : [selectedJour];
                    return (
                      <tr key={heure} className="border-b border-border/50 last:border-0">
                        <td className="py-2 px-3 text-xs font-medium text-muted-foreground border-r border-border sticky start-0 bg-card z-10">
                          {heure}
                        </td>
                        {displayJours.map((jour) => {
                          const slotsInCell = filteredSlots.filter(
                            (ts) => ts.jour === jour && ts.heureDebut === heure
                          );
                          return (
                            <td
                              key={`${jour}-${heure}`}
                              className="py-1 px-1.5 border-border align-top"
                            >
                              {slotsInCell.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {slotsInCell.map((slot) => (
                                    <button
                                      key={slot.id}
                                      onClick={() => setViewSlot(slot)}
                                      className={`w-full rounded-lg border p-2 text-start transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer ${
                                        subjectColorMap[slot.matiere] ?? slotColors[0]
                                      }`}
                                    >
                                      <p className="text-xs font-semibold leading-tight">
                                        {slot.matiere}
                                      </p>
                                      <p className="text-[11px] opacity-80 mt-0.5">
                                        {slot.classe} &middot; {getRoomName(slot.salleId)}
                                      </p>
                                      <p className="text-[10px] opacity-60 mt-0.5">
                                        {slot.enseignant}
                                      </p>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="h-12" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            custom={8}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-semibold text-muted-foreground mb-2">{t("schedule.subject")}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(subjectColorMap).map(([matiere, colorClass]) => (
                <span
                  key={matiere}
                  className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${colorClass}`}
                >
                  {matiere}
                </span>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* ─── View Room Dialog ──────────────────────────────── */}
      <Dialog open={!!viewRoom} onOpenChange={(open) => !open && setViewRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rooms.roomDetails")}</DialogTitle>
            <DialogDescription>{t("common.details")}</DialogDescription>
          </DialogHeader>
          {viewRoom && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                    roomTypeIcons[viewRoom.type] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  <DoorOpen className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-heading text-lg font-bold">{viewRoom.nom}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusConfig[viewRoom.statut]?.bg
                    } ${statusConfig[viewRoom.statut]?.text}`}
                  >
                    {viewRoom.statut}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium">{viewRoom.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Capacité</p>
                  <p className="font-medium">{viewRoom.capacite} places</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Étage</p>
                  <p className="font-medium">
                    {viewRoom.etage === 0 ? "Rez-de-chaussée" : `Étage ${viewRoom.etage}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Créneaux attribués</p>
                  <p className="font-medium">
                    {timeSlots.filter((ts) => ts.salleId === viewRoom.id).length}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Équipements</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {viewRoom.equipements.map((eq) => (
                      <Badge key={eq} variant="outline" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ───────────────── */}
      <Dialog
        open={!!deleteRoomTarget}
        onOpenChange={(open) => !open && setDeleteRoomTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("common.deleteConfirmMsg")}{" "}
              <span className="font-semibold text-foreground">{deleteRoomTarget?.nom}</span> ?
              {t("common.irreversible")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteRoom} disabled={deleteRoomMutation.isPending}>
              {deleteRoomMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View TimeSlot Dialog ──────────────────────── */}
      <Dialog open={!!viewSlot} onOpenChange={(open) => !open && setViewSlot(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Détails du créneau</DialogTitle>
            <DialogDescription>Informations du créneau horaire</DialogDescription>
          </DialogHeader>
          {viewSlot && (
            <div className="space-y-3 mt-2">
              <div
                className={`rounded-xl border p-3 ${
                  subjectColorMap[viewSlot.matiere] ?? slotColors[0]
                }`}
              >
                <p className="text-sm font-bold">{viewSlot.matiere}</p>
                <p className="text-xs opacity-80 mt-0.5">{viewSlot.enseignant}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Jour</p>
                  <p className="font-medium">{viewSlot.jour}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horaire</p>
                  <p className="font-medium">
                    {viewSlot.heureDebut} - {viewSlot.heureFin}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Salle</p>
                  <p className="font-medium">{getRoomName(viewSlot.salleId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Classe</p>
                  <p className="font-medium">{viewSlot.classe}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Niveau</p>
                  <p className="font-medium">{viewSlot.niveau}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enseignant</p>
                  <p className="font-medium">{viewSlot.enseignant}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
