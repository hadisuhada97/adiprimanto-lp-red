"use client";

import CrudSection, { type CrudColumn, type CrudField } from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";

const fields: CrudField[] = [
  { key: "label", label: "Label", translated: true, required: true, placeholder: "Layanan" },
  { key: "anchor", label: "Anchor", hint: "In-page target, e.g. #services" },
  { key: "url", label: "URL", hint: "Use this instead of an anchor for external links" },
  {
    key: "target",
    label: "Opens in",
    type: "select",
    defaultValue: "_self",
    options: [
      { value: "_self", label: "Same tab" },
      { value: "_blank", label: "New tab" },
    ],
  },
  { key: "is_active", label: "Active", type: "switch", defaultValue: true },
];

const columns: CrudColumn[] = [
  { header: "Label", render: (row) => (row.label as string | null) ?? "—" },
  {
    header: "Target",
    render: (row) => (
      <span className="font-mono text-xs">
        {(row.anchor as string | null) ?? (row.url as string | null) ?? "—"}
      </span>
    ),
  },
  { header: "Opens in", render: (row) => (row.target === "_blank" ? "New tab" : "Same tab") },
];

export default function NavigationPage() {
  return (
    <>
      <PageBreadcrumb title="Navigation Menu" trail={[{ label: "Appearance" }]} />

      <div className="flex flex-col gap-6">
        <CrudSection
          title="Header menu"
          description="Links in the sticky navbar, in display order."
          endpoint="/admin/navigation-menus"
          permission="navigation_menus"
          testIdPrefix="nav-header"
          entityName="menu item"
          labelKey="label"
          hiddenValues={{ location: "header" }}
          extraQuery={{ location: "header" }}
          fields={fields}
          columns={columns}
        />

        <CrudSection
          title="Footer menu"
          description="Links in the footer navigation column."
          endpoint="/admin/navigation-menus"
          permission="navigation_menus"
          testIdPrefix="nav-footer"
          entityName="menu item"
          labelKey="label"
          hiddenValues={{ location: "footer" }}
          extraQuery={{ location: "footer" }}
          fields={fields}
          columns={columns}
        />
      </div>
    </>
  );
}
