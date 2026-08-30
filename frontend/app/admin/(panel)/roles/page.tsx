"use client";

import { Check, Loader2, Minus, ShieldCheck } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import { TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useToast } from "@/app/lib/admin/toast";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  users_count?: number;
  permissions: string[];
};

type Module = {
  module: string;
  label: string;
  permissions: { id: string; slug: string; action: string }[];
};

export default function RolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiRequest<{ roles: Role[]; modules: Module[] }>("/admin/roles", {
          auth: true,
        });
        setRoles(data.roles);
        setModules(data.modules);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Could not load the roles.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [toast]);

  return (
    <>
      <PageBreadcrumb title="Roles & Permissions" trail={[{ label: "System" }]} />

      {loading ? (
        <div className="flex justify-center py-24" data-testid="roles-loading">
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-6" data-testid="roles-page">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div
                key={role.id}
                data-testid={`role-card-${role.slug}`}
                className="rounded-2xl border border-admin-gray-200 bg-admin-white p-5 dark:border-admin-gray-800 dark:bg-admin-gray-900"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-admin-gray-900 dark:text-admin-white/90">
                  <ShieldCheck size={16} className="text-brand-500" />
                  {role.name}
                </p>
                <p className="mt-2 text-xs text-admin-gray-500 dark:text-admin-gray-400">
                  {role.description ?? "—"}
                </p>
                <p className="mt-3 text-xs text-admin-gray-500 dark:text-admin-gray-400">
                  {role.permissions.length} permissions · {role.users_count ?? 0} users
                </p>
              </div>
            ))}
          </div>

          <TableCard testId="roles-matrix-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                  <tr>
                    <th className="px-6 py-3">Permission</th>
                    {roles.map((role) => (
                      <th key={role.id} className="px-4 py-3 text-center">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                  {modules.map((module) => (
                    <Fragment key={module.module}>
                      <tr className="bg-admin-gray-50/60 dark:bg-admin-gray-800/30">
                        <td
                          colSpan={roles.length + 1}
                          className="px-6 py-2 text-xs font-semibold tracking-wide text-admin-gray-600 uppercase dark:text-admin-gray-300"
                        >
                          {module.label}
                        </td>
                      </tr>
                      {module.permissions.map((permission) => (
                        <tr key={permission.id} data-testid={`permission-row-${permission.slug}`}>
                          <td className="px-6 py-2.5 font-mono text-xs text-admin-gray-600 dark:text-admin-gray-300">
                            {permission.slug}
                          </td>
                          {roles.map((role) => (
                            <td key={role.id} className="px-4 py-2.5 text-center">
                              {role.permissions.includes(permission.slug) ? (
                                <Check size={15} className="mx-auto text-success-500" />
                              ) : (
                                <Minus size={15} className="mx-auto text-admin-gray-300 dark:text-admin-gray-700" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard>
        </div>
      )}
    </>
  );
}
