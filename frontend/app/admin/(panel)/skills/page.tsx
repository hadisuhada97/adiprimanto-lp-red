"use client";

import { useCallback, useEffect, useState } from "react";
import CrudSection, { type CrudField } from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import { apiRequest } from "@/app/lib/admin/api-client";
import type { CrudRow } from "@/app/components/admin/CrudSection";

export default function SkillsPage() {
  const [categories, setCategories] = useState<CrudRow[]>([]);
  const [token, setToken] = useState(0);

  const loadCategories = useCallback(async () => {
    const { data } = await apiRequest<CrudRow[]>("/admin/skill-categories", { auth: true });
    setCategories(data);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories, token]);

  const categoryOptions = [
    { value: "", label: "No category" },
    ...categories.map((category) => ({
      value: category.id,
      label: (category.name as string | null) ?? category.id,
    })),
  ];

  const skillFields: CrudField[] = [
    { key: "name", label: "Name", required: true, placeholder: "React JS" },
    { key: "skill_category_id", label: "Category", type: "select", options: categoryOptions },
    { key: "icon_name", label: "Icon name", hint: "react-icons/si name, e.g. SiReact" },
    { key: "color_hex", label: "Brand colour", type: "color" },
    { key: "proficiency", label: "Proficiency (0-100)", type: "number" },
    { key: "is_active", label: "Active", type: "switch", defaultValue: true },
  ];

  return (
    <>
      <PageBreadcrumb title="Skills & Tech Stack" trail={[{ label: "Content" }]} />

      <div className="flex flex-col gap-6">
        <CrudSection
          title="Skill categories"
          description="Groups shown as columns in the tech stack section."
          endpoint="/admin/skill-categories"
          permission="skills"
          testIdPrefix="skill-category"
          entityName="category"
          labelKey="name"
          reloadToken={token}
          onChanged={() => setToken((state) => state + 1)}
          fields={[
            { key: "name", label: "Name", translated: true, required: true, placeholder: "Frontend Core" },
            { key: "eyebrow", label: "Eyebrow", hint: "Small number badge, e.g. 01" },
            { key: "icon_name", label: "Icon name" },
            { key: "is_active", label: "Active", type: "switch", defaultValue: true },
          ]}
          columns={[
            { header: "Name", render: (row) => (row.name as string | null) ?? "—" },
            { header: "Eyebrow", render: (row) => (row.eyebrow as string | null) ?? "—" },
            {
              header: "Skills",
              render: (row) => String((row.skills_count as number | undefined) ?? 0),
            },
          ]}
        />

        <CrudSection
          title="Skills"
          description="Individual tools and technologies. Names are not translated."
          endpoint="/admin/skills"
          permission="skills"
          testIdPrefix="skill"
          entityName="skill"
          labelKey="name"
          searchable
          reloadToken={token}
          fields={skillFields}
          columns={[
            { header: "Skill", render: (row) => (row.name as string) ?? "—" },
            {
              header: "Category",
              render: (row) => {
                const category = row.category as { name?: string | null } | null;

                return category?.name ?? "—";
              },
            },
            { header: "Icon", render: (row) => (row.icon_name as string | null) ?? "—" },
            {
              header: "Colour",
              render: (row) => {
                const color = row.color_hex as string | null;

                return color === null ? (
                  "—"
                ) : (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-admin-gray-300 dark:border-admin-gray-700"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono text-xs">{color}</span>
                  </span>
                );
              },
            },
          ]}
        />
      </div>
    </>
  );
}
