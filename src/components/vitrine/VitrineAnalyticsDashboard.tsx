import { Loader2, TrendingUp, Eye, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVitrineAnalytics } from "@/hooks/useVitrineAdmin";

export default function VitrineAnalyticsDashboard() {
  const { data, isLoading } = useVitrineAnalytics();

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des visites</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalViews.toLocaleString("fr-FR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">7 derniers jours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.viewsLast7Days.toLocaleString("fr-FR")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">30 derniers jours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.viewsLast30Days.toLocaleString("fr-FR")}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views by page */}
        <Card>
          <CardHeader>
            <CardTitle>Pages les plus visit&eacute;es (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.viewsByPage.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de donn&eacute;es</p>
            ) : (
              <div className="space-y-3">
                {data.viewsByPage.map((item, i) => {
                  const max = data.viewsByPage[0]?.views || 1;
                  const pct = (item.views / max) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">/{item.page}</span>
                        <span className="text-muted-foreground">{item.views}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Views by day (simple bar chart with divs) */}
        <Card>
          <CardHeader>
            <CardTitle>Visites par jour (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.viewsByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de donn&eacute;es</p>
            ) : (
              <div className="flex h-48 items-end gap-1">
                {data.viewsByDay.map((day, i) => {
                  const max = Math.max(...data.viewsByDay.map((d) => d.views), 1);
                  const pct = (day.views / max) * 100;
                  return (
                    <div key={i} className="group relative flex-1" title={`${day.date}: ${day.views} visites`}>
                      <div
                        className="w-full rounded-t bg-primary/80 transition-colors hover:bg-primary"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                        {day.date}: {day.views}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
