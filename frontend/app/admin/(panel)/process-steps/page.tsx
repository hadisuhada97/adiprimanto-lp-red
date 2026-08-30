"use client";

import CrudSection from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";

export default function ProcessStepsPage() {
  return (
    <>
      <PageBreadcrumb title="Process Steps" trail={[{ label: "Content" }]} />

      <CrudSection
        title="Process steps"
        description="How you work, from the first brief to launch and support."
        endpoint="/admin/process-steps"
        permission="process_steps"
        testIdPrefix="process-step"
        entityName="step"
        labelKey="title"
        searchable
        fields={[
          { key: "title", label: "Title", translated: true, required: true, placeholder: "Brief & Analisis" },
          { key: "description", label: "Description", type: "textarea", translated: true, full: true },
          { key: "step_number", label: "Step number", type: "number", defaultValue: "1" },
          { key: "icon_name", label: "Icon name", hint: "lucide-react icon, e.g. Rocket" },
          { key: "is_active", label: "Active", type: "switch", defaultValue: true },
        ]}
        columns={[
          { header: "#", render: (row) => String((row.step_number as number | undefined) ?? "—") },
          { header: "Title", render: (row) => (row.title as string | null) ?? "—" },
          {
            header: "Description",
            render: (row) => (
              <span className="line-clamp-2 max-w-md text-xs">
                {(row.description as string | null) ?? "—"}
              </span>
            ),
          },
          { header: "Icon", render: (row) => (row.icon_name as string | null) ?? "—" },
        ]}
      />
    </>
  );
}
