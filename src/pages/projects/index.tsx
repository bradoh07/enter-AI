import { useMemo, useState } from "react";
import { FolderKanban, Plus, Search, Scale } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProjectCard } from "./ProjectCard";
import { EmptyState, PageLoading } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAnalysisHistory } from "@/hooks/use-project-workspace";
import {
  useDeleteProject,
  useDuplicateProject,
  useProjects,
} from "@/hooks/use-projects";
import { toast } from "@/components/ui/sonner";

const MAX_COMPARE = 4;

const ProjectsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const { data: runs } = useAnalysisHistory();
  const duplicateProject = useDuplicateProject();
  const deleteProject = useDeleteProject();

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const latestByProject = useMemo(() => {
    const map = new Map<string, NonNullable<typeof runs>[number]>();
    (runs ?? []).forEach((run) => {
      if (!map.has(run.project_id)) map.set(run.project_id, run);
    });
    return map;
  }, [runs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects ?? [];
    return (projects ?? []).filter((project) =>
      `${project.name} ${project.idea} ${project.sectors.join(" ")}`
        .toLowerCase()
        .includes(needle),
    );
  }, [projects, query]);

  const toggleSelected = (projectId: string, next: boolean) => {
    setSelectedIds((current) => {
      if (!next) return current.filter((id) => id !== projectId);
      if (current.includes(projectId)) return current;
      if (current.length >= MAX_COMPARE) {
        toast.info(t("projects.compareLimit", { count: MAX_COMPARE }));
        return current;
      }
      return [...current, projectId];
    });
  };

  const handleDuplicate = async (projectId: string) => {
    try {
      const copy = await duplicateProject.mutateAsync(projectId);
      toast.success(t("projects.toast.duplicated", { name: copy.name }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.unknownError"));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteProject.mutateAsync(pendingDelete);
      setSelectedIds((current) => current.filter((id) => id !== pendingDelete));
      toast.success(t("projects.toast.deleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.unknownError"));
    } finally {
      setPendingDelete(null);
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("projects.title")}
        description={t("projects.subtitle")}
        actions={
          <Button asChild>
            <Link to="/simulations/new">
              <Plus className="h-4 w-4" />
              {t("projects.action.new")}
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("projects.searchPlaceholder")}
            className="pl-9"
            aria-label={t("projects.searchPlaceholder")}
          />
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("projects.selectedCount", { count: selectedIds.length })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              {t("common.clearSelection")}
            </Button>
            <Button
              size="sm"
              disabled={selectedIds.length < 2}
              onClick={() => navigate(`/projects/compare?ids=${selectedIds.join(",")}`)}
            >
              <Scale className="h-4 w-4" />
              {t("projects.action.compare")}
            </Button>
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={(projects?.length ?? 0) === 0 ? t("projects.empty.title") : t("projects.empty.filteredTitle")}
          description={
            (projects?.length ?? 0) === 0
              ? t("projects.empty.description")
              : t("projects.empty.filteredDescription")
          }
          action={
            (projects?.length ?? 0) === 0 ? (
              <Button asChild>
                <Link to="/simulations/new">
                  <Plus className="h-4 w-4" />
                  {t("projects.empty.action")}
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              latestRun={latestByProject.get(project.id)}
              selected={selectedIds.includes(project.id)}
              onSelectedChange={(next) => toggleSelected(project.id, next)}
              onDuplicate={() => void handleDuplicate(project.id)}
              onDelete={() => setPendingDelete(project.id)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("projects.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("projects.delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("projects.action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsPage;
