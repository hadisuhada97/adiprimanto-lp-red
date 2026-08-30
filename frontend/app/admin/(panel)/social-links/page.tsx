"use client";

import CrudSection from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";

export default function SocialLinksPage() {
  return (
    <>
      <PageBreadcrumb title="Social Links" trail={[{ label: "Appearance" }]} />

      <CrudSection
        title="Social links"
        description="Profiles listed in the footer. Platform names are not translated."
        endpoint="/admin/social-links"
        permission="contact_channels"
        testIdPrefix="social-link"
        entityName="link"
        labelKey="platform"
        searchable
        fields={[
          { key: "platform", label: "Platform", required: true, placeholder: "LinkedIn" },
          { key: "url", label: "Profile URL", required: true, placeholder: "https://linkedin.com/in/…" },
          { key: "icon_name", label: "Icon name", hint: "lucide-react icon, e.g. Linkedin" },
          { key: "color_hex", label: "Brand colour", type: "color" },
          { key: "is_active", label: "Active", type: "switch", defaultValue: true },
        ]}
        columns={[
          { header: "Platform", render: (row) => (row.platform as string) ?? "—" },
          {
            header: "URL",
            render: (row) => (
              <span className="line-clamp-1 max-w-sm text-xs">{(row.url as string) ?? "—"}</span>
            ),
          },
          { header: "Icon", render: (row) => (row.icon_name as string | null) ?? "—" },
        ]}
      />
    </>
  );
}
