"use client";

import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import ProjectForm from "@/app/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <>
      <PageBreadcrumb
        title="New project"
        trail={[{ label: "Content" }, { label: "Projects", href: "/admin/portfolio/projects" }]}
      />
      <ProjectForm />
    </>
  );
}
