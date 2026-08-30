"use client";

import CrudSection from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";

export default function SeoSettingsPage() {
  return (
    <>
      <PageBreadcrumb title="SEO" trail={[{ label: "Settings" }]} />

      <CrudSection
        title="Per-page SEO"
        description="Meta title, description and social preview image for every public page."
        endpoint="/admin/seo-settings"
        permission="seo_settings"
        testIdPrefix="seo"
        entityName="page"
        labelKey="page_key"
        searchable
        fields={[
          { key: "page_key", label: "Page key", required: true, placeholder: "home" },
          {
            key: "robots_directive",
            label: "Robots",
            type: "select",
            defaultValue: "index,follow",
            options: [
              { value: "index,follow", label: "index, follow" },
              { value: "noindex,follow", label: "noindex, follow" },
              { value: "index,nofollow", label: "index, nofollow" },
              { value: "noindex,nofollow", label: "noindex, nofollow" },
            ],
          },
          { key: "meta_title", label: "Meta title", translated: true, required: true, full: true },
          {
            key: "meta_description",
            label: "Meta description",
            type: "textarea",
            translated: true,
            full: true,
          },
          { key: "meta_keywords", label: "Meta keywords", translated: true, full: true },
          { key: "og_image_media_id", label: "Social image", type: "media", mediaPreviewKey: "og_image" },
          { key: "is_active", label: "Active", type: "switch", defaultValue: true },
          {
            key: "structured_data",
            label: "Structured data (JSON-LD)",
            type: "json",
            full: true,
            hint: "Optional JSON object injected as JSON-LD",
          },
        ]}
        columns={[
          {
            header: "Page",
            render: (row) => <span className="font-mono text-xs">{(row.page_key as string) ?? "—"}</span>,
          },
          { header: "Meta title", render: (row) => (row.meta_title as string | null) ?? "—" },
          {
            header: "Meta description",
            render: (row) => (
              <span className="line-clamp-2 max-w-md text-xs">
                {(row.meta_description as string | null) ?? "—"}
              </span>
            ),
          },
          { header: "Robots", render: (row) => (row.robots_directive as string | null) ?? "—" },
        ]}
      />
    </>
  );
}
