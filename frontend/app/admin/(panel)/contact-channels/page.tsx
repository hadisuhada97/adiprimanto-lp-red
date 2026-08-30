"use client";

import CrudSection from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";

export default function ContactChannelsPage() {
  return (
    <>
      <PageBreadcrumb title="Contact Channels" trail={[{ label: "Appearance" }]} />

      <CrudSection
        title="Contact channels"
        description="How visitors reach you: WhatsApp, email, Instagram and anything else."
        endpoint="/admin/contact-channels"
        permission="contact_channels"
        testIdPrefix="contact-channel"
        entityName="channel"
        labelKey="label"
        searchable
        fields={[
          { key: "label", label: "Label", translated: true, required: true, placeholder: "WhatsApp" },
          {
            key: "type",
            label: "Type",
            type: "select",
            defaultValue: "whatsapp",
            options: [
              { value: "whatsapp", label: "WhatsApp" },
              { value: "email", label: "Email" },
              { value: "instagram", label: "Instagram" },
              { value: "linkedin", label: "LinkedIn" },
              { value: "github", label: "GitHub" },
              { value: "custom", label: "Custom" },
            ],
          },
          { key: "value", label: "Displayed value", placeholder: "+62 857-2734-6620" },
          { key: "url", label: "Link", placeholder: "https://wa.me/62857…", full: true },
          { key: "icon_name", label: "Icon name", hint: "lucide-react icon, e.g. MessageCircle" },
          { key: "color_hex", label: "Accent colour", type: "color" },
          { key: "is_active", label: "Active", type: "switch", defaultValue: true },
        ]}
        columns={[
          { header: "Label", render: (row) => (row.label as string | null) ?? "—" },
          { header: "Type", render: (row) => (row.type as string) ?? "—" },
          { header: "Value", render: (row) => (row.value as string | null) ?? "—" },
          {
            header: "Link",
            render: (row) => (
              <span className="line-clamp-1 max-w-[16rem] text-xs">{(row.url as string | null) ?? "—"}</span>
            ),
          },
        ]}
      />
    </>
  );
}
