"use client";

import { KeyRound, Loader2, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, Switch, TextInput } from "@/app/components/admin/ui/Form";
import Modal from "@/app/components/admin/ui/Modal";
import { EmptyState, StatusBadge, TableCard } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_two_factor_enabled: boolean;
  last_login_at: string | null;
  roles: { id: string; name: string; slug: string }[];
};

type Role = { id: string; name: string; slug: string };

export default function UsersPage() {
  const toast = useToast();
  const { can, user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (showTrashed) query.set("trashed", "1");

      const [userResponse, roleResponse] = await Promise.all([
        apiRequest<AdminUser[]>(`/admin/users?${query}`, { auth: true }),
        apiRequest<{ roles: Role[] }>("/admin/roles", { auth: true }),
      ]);

      setUsers(userResponse.data);
      setRoles(roleResponse.data.roles);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the users.");
    } finally {
      setLoading(false);
    }
  }, [search, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRoleIds([]);
    setIsActive(true);
    setTwoFactor(true);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: AdminUser) => {
    setEditingId(item.id);
    setName(item.name);
    setEmail(item.email);
    setPassword("");
    setRoleIds(item.roles.map((role) => role.id));
    setIsActive(item.is_active);
    setTwoFactor(item.is_two_factor_enabled);
    setErrors({});
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setErrors({});

    try {
      const body: Record<string, unknown> = {
        name,
        email,
        role_ids: roleIds,
        is_active: isActive,
        is_two_factor_enabled: twoFactor,
      };

      if (password !== "") body.password = password;

      const { message } = editingId
        ? await apiRequest(`/admin/users/${editingId}`, { method: "PATCH", auth: true, body })
        : await apiRequest("/admin/users", { method: "POST", auth: true, body });

      toast.success(message);
      setModalOpen(false);
      await load();
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.errors).length > 0) {
        setErrors(
          Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value[0]])),
        );
        toast.error(error.message);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Could not save the user.");
      }
    } finally {
      setSaving(false);
    }
  };

  const act = async (path: string, method: "PATCH" | "POST", fallback: string) => {
    try {
      const { message } = await apiRequest(path, { method, auth: true });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : fallback);
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const { message } = await apiRequest(`/admin/users/${pendingDelete.id}`, {
        method: "DELETE",
        auth: true,
      });
      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Users" trail={[{ label: "System" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            data-testid="user-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => setShowTrashed((state) => !state)}
          data-testid="user-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("users.create") ? (
          <Button onClick={openCreate} data-testid="user-create-button">
            <Plus size={16} />
            New user
          </Button>
        ) : null}
      </div>

      <TableCard testId="user-table-card">
        {loading ? (
          <div className="flex justify-center py-20" data-testid="user-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={showTrashed ? "Trash is empty" : "No users found"}
            message="Admin accounts that can sign in to this panel."
            testId="user-empty-state"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-admin-gray-200 bg-admin-gray-50 text-left text-xs font-medium tracking-wide text-admin-gray-500 uppercase dark:border-admin-gray-800 dark:bg-admin-gray-800/50 dark:text-admin-gray-400">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Roles</th>
                  <th className="px-6 py-3">2FA</th>
                  <th className="px-6 py-3">Last login</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800">
                {users.map((item) => (
                  <tr key={item.id} data-testid={`user-row-${item.id}`}>
                    <td className="px-6 py-4">
                      <span className="block font-medium text-admin-gray-800 dark:text-admin-white/90">
                        {item.name}
                        {item.id === currentUser?.id ? (
                          <span className="ml-2 align-middle">
                            <StatusBadge tone="brand">You</StatusBadge>
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-xs text-admin-gray-500 dark:text-admin-gray-400">
                        {item.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex flex-wrap gap-1">
                        {item.roles.map((role) => (
                          <StatusBadge key={role.id} tone="neutral">
                            {role.name}
                          </StatusBadge>
                        ))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={item.is_two_factor_enabled ? "success" : "warning"}>
                        {item.is_two_factor_enabled ? "On" : "Off"}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-xs text-admin-gray-500 dark:text-admin-gray-400">
                      {item.last_login_at === null ? "Never" : new Date(item.last_login_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {showTrashed ? (
                        <StatusBadge tone="neutral">Trashed</StatusBadge>
                      ) : can("users.update") && item.id !== currentUser?.id ? (
                        <Switch
                          checked={item.is_active}
                          onChange={() => void act(`/admin/users/${item.id}/toggle-active`, "PATCH", "Could not update.")}
                          label={`Toggle ${item.name}`}
                          testId={`user-toggle-active-${item.id}`}
                        />
                      ) : (
                        <StatusBadge tone={item.is_active ? "success" : "neutral"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </StatusBadge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {showTrashed ? (
                          <button
                            type="button"
                            onClick={() => void act(`/admin/users/${item.id}/restore`, "POST", "Could not restore.")}
                            aria-label="Restore user"
                            data-testid={`user-restore-button-${item.id}`}
                            className="rounded-lg p-2 text-success-500 transition-colors hover:bg-success-500/10"
                          >
                            <RotateCcw size={15} />
                          </button>
                        ) : can("users.update") ? (
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label="Edit user"
                            data-testid={`user-edit-button-${item.id}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-brand-500 dark:hover:bg-admin-gray-800"
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}

                        {can("users.delete") && item.id !== currentUser?.id && !showTrashed ? (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            aria-label="Delete user"
                            data-testid={`user-delete-button-${item.id}`}
                            className="rounded-lg p-2 text-admin-gray-500 transition-colors hover:bg-error-500/10 hover:text-error-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit user" : "New user"}
        description="Passwords are hashed on the server and never returned by the API."
        onClose={() => setModalOpen(false)}
        size="md"
        testId="user-form-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} data-testid="user-form-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void submit()} data-testid="user-form-submit-button">
              {editingId ? "Save changes" : "Create user"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name" required error={errors.name} testId="user-name-field">
            <TextInput
              value={name}
              hasError={errors.name !== undefined}
              onChange={(event) => setName(event.target.value)}
              data-testid="user-name-input"
            />
          </Field>

          <Field label="Email" required error={errors.email} testId="user-email-field">
            <TextInput
              type="email"
              value={email}
              hasError={errors.email !== undefined}
              onChange={(event) => setEmail(event.target.value)}
              data-testid="user-email-input"
            />
          </Field>

          <Field
            label={editingId ? "New password" : "Password"}
            required={editingId === null}
            hint="Minimum 12 characters. Changing it signs the user out everywhere."
            error={errors.password}
            testId="user-password-field"
          >
            <TextInput
              type="password"
              value={password}
              hasError={errors.password !== undefined}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={editingId ? "Leave empty to keep the current password" : ""}
              data-testid="user-password-input"
            />
          </Field>

          <Field label="Roles" required error={errors.role_ids} testId="user-roles-field">
            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 rounded-lg border border-admin-gray-200 px-4 py-2.5 text-sm text-admin-gray-700 dark:border-admin-gray-800 dark:text-admin-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={roleIds.includes(role.id)}
                    onChange={(event) =>
                      setRoleIds((state) =>
                        event.target.checked ? [...state, role.id] : state.filter((id) => id !== role.id),
                      )
                    }
                    data-testid={`user-role-checkbox-${role.slug}`}
                    className="h-4 w-4 accent-brand-500"
                  />
                  <ShieldCheck size={15} className="text-brand-500" />
                  {role.name}
                </label>
              ))}
            </div>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="text-sm text-admin-gray-700 dark:text-admin-gray-300">Active</span>
              <Switch checked={isActive} onChange={setIsActive} label="Active" testId="user-form-active-switch" />
            </div>
            <div className="flex flex-1 items-center justify-between rounded-lg border border-admin-gray-200 px-4 py-3 dark:border-admin-gray-800">
              <span className="flex items-center gap-2 text-sm text-admin-gray-700 dark:text-admin-gray-300">
                <KeyRound size={15} />
                Require 2FA
              </span>
              <Switch checked={twoFactor} onChange={setTwoFactor} label="Require 2FA" testId="user-form-2fa-switch" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Move to trash"
        message={`“${pendingDelete?.name}” will lose access immediately and all their sessions will be revoked.`}
        confirmLabel="Move to trash"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="user-delete-dialog"
      />
    </>
  );
}
