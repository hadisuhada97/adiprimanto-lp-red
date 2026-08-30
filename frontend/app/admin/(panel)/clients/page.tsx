"use client";

import Image from "next/image";
import CrudSection from "@/app/components/admin/CrudSection";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import { StatusBadge } from "@/app/components/admin/ui/Table";
import type { MediaItem } from "@/app/lib/admin/types";

export default function ClientsPage() {
  return (
    <>
      <PageBreadcrumb title="Clients & Brands" trail={[{ label: "Content" }]} />

      <CrudSection
        title="Clients & brands"
        description="The logo marquee that builds trust right under the hero."
        endpoint="/admin/clients"
        permission="clients"
        testIdPrefix="client"
        entityName="client"
        labelKey="name"
        searchable
        fields={[
          { key: "name", label: "Name", required: true, placeholder: "TripLinq" },
          { key: "website_url", label: "Website URL", placeholder: "https://example.com" },
          {
            key: "description",
            label: "Short description",
            translated: true,
            full: true,
          },
          { key: "logo_media_id", label: "Logo", type: "media", mediaPreviewKey: "logo" },
          { key: "icon_name", label: "Icon name", hint: "Fallback when there is no logo" },
          { key: "font_class", label: "Font class", hint: "Tailwind classes for the wordmark", full: true },
          { key: "is_featured", label: "Featured", type: "switch" },
          { key: "is_active", label: "Active", type: "switch", defaultValue: true },
        ]}
        columns={[
          {
            header: "Client",
            render: (row) => {
              const logo = row.logo as MediaItem | null;

              return (
                <span className="flex items-center gap-3">
                  {logo ? (
                    <Image
                      src={logo.url}
                      alt={row.name as string}
                      width={32}
                      height={32}
                      unoptimized
                      className="h-8 w-8 rounded object-contain"
                    />
                  ) : null}
                  <span className="font-medium text-admin-gray-800 dark:text-admin-white/90">
                    {(row.name as string) ?? "—"}
                  </span>
                  {row.is_featured === true ? <StatusBadge tone="brand">Featured</StatusBadge> : null}
                </span>
              );
            },
          },
          {
            header: "Description",
            render: (row) => (
              <span className="line-clamp-1 max-w-xs text-xs">
                {(row.description as string | null) ?? "—"}
              </span>
            ),
          },
          {
            header: "Website",
            render: (row) => (
              <span className="line-clamp-1 max-w-[14rem] text-xs">
                {(row.website_url as string | null) ?? "—"}
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
