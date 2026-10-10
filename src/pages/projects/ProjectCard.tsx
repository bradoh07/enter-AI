import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPercent, resolveCurrencyLocale } from "@/lib/simulation/format";
import { businessModelLabel, projectStageLabel, scaleLabel } from "@/lib/domain/options";
import { parseSimulationResult } from "@/lib/simulation/run";
import type { Project, SimulationRun } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const ProjectCard = ({
  project,
  latestRun,
  selected,
  onSelectedChange,
  onDuplicate,
  onDelete,
}: {
  project: Project;
  latestRun: SimulationRun | undefined;
  selected: boolean;
  onSelectedChange: (next: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const locale = resolveCurrencyLocale(
    (project.currency as "KRW" | "USD") ?? "KRW",
    i18n.language,
  );
  const result = latestRun ? parseSimulationResult(latestRun.results) : null;
  const kpis = result?.scenarios.base.kpis;

  return (
    <Card className={cn("shadow-panel transition-colors", selected && "border-primary")}>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelectedChange(checked === true)}
              aria-label={t("projects.compareSelect")}
              className="mt-0.5"
            />
            <div className="min-w-0 space-y-1">
              <Link
                to={`/projects/${project.id}`}
                className="block truncate text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {project.name}
              </Link>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {project.idea || t("projects.noIdea")}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("common.moreActions")}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                {t("projects.action.duplicate")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("projects.action.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="muted">{projectStageLabel(t, project.stage ?? "")}</Badge>
          <Badge variant="muted">{scaleLabel(t, project.scale ?? "")}</Badge>
          {project.sectors.slice(0, 2).map((sector) => (
            <Badge key={sector} variant="outline">
              {businessModelLabel(t, sector)}
            </Badge>
          ))}
          {project.sectors.length > 2 ? (
            <Badge variant="outline">
              {t("projects.moreSectors", { count: project.sectors.length - 2 })}
            </Badge>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t("simulation.kpi.operatingMargin")}
            </dt>
            <dd
              className={cn(
                "tabular text-sm font-semibold",
                kpis ? (kpis.operatingMarginPct >= 0 ? "text-success" : "text-destructive") : "text-muted-foreground",
              )}
            >
              {kpis ? formatPercent(kpis.operatingMarginPct, 1, locale) : t("projects.notSimulated")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t("simulation.kpi.payback")}
            </dt>
            <dd className="tabular text-sm font-semibold text-foreground">
              {kpis
                ? kpis.paybackMonths === null
                  ? t("simulation.value.beyondHorizon")
                  : t("simulation.value.monthNumber", { month: kpis.paybackMonths })
                : t("projects.notSimulated")}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};
