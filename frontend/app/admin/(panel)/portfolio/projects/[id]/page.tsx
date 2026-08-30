"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import ProjectForm from "@/app/components/admin/ProjectForm";
import { EmptyState } from "@/app/components/admin/ui/Table";
import { FileWarning } from "lucide-react";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useToast } from "@/app/lib/admin/toast";
import type { Project } from "@/app/lib/admin/types";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiRequest<Project>(`/admin/projects/${params.id}`, { auth: true });
      setProject(data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the project.");
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageBreadcrumb
        title={project?.translations.id?.title ?? project?.title ?? "Edit project"}
        trail={[{ label: "Content" }, { label: "Projects", href: "/admin/portfolio/projects" }]}
      />

      {loading ? (
        <div className="flex justify-center py-24" data-testid="project-edit-loading">
          <Loader2 size={24} className="animate-spin text-brand-500" />
        </div>
      ) : project === null ? (
        <div className="rounded-2xl border border-admin-gray-200 bg-admin-white dark:border-admin-gray-800 dark:bg-admin-gray-900">
          <EmptyState
            icon={FileWarning}
            title="Project not found"
            message="It may have been deleted. Check the trash on the projects list."
            testId="project-edit-not-found"
          />
        </div>
      ) : (
        <ProjectForm project={project} />
      )}
    </>
  );
}
