"use client";

import CrudSection from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";

export default function PainPointsPage() {
  return (
    <>
      <PageBreadcrumb title="Pain Points" trail={[{ label: "Content" }]} />

      <CrudSection
        title="Pain points"
        description="The problems your visitors recognise themselves in, shown above the services."
        endpoint="/admin/pain-points"
        permission="pain_points"
        testIdPrefix="pain-point"
        entityName="pain point"
        labelKey="title"
        searchable
        fields={[
          { key: "title", label: "Title", translated: true, required: true, placeholder: "Lambat & Tidak Optimal" },
          {
            key: "description",
            label: "Description",
            type: "textarea",
            translated: true,
            full: true,
          },
          { key: "icon_name", label: "Icon name", hint: "lucide-react icon, e.g. Gauge" },
          { key: "is_active", label: "Active", type: "switch", defaultValue: true },
        ]}
        columns={[
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
