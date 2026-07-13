import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi, type SchoolSettingsDTO } from "@/api/settings.api";

const KEY = "school-settings";

export function useSchoolSettings() {
  return useQuery<SchoolSettingsDTO>({
    queryKey: [KEY],
    queryFn: () => settingsApi.get(),
  });
}

export function useUpdateSchoolSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SchoolSettingsDTO) => settingsApi.update(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
