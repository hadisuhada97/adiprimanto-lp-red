"use client";

import {
  FileText,
  ImageOff,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, TextInput } from "@/app/components/admin/ui/Form";
import Modal from "@/app/components/admin/ui/Modal";
import { EmptyState } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest, apiUpload } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";
import { formatBytes, type MediaItem, type Pagination } from "@/app/lib/admin/types";

export default function MediaLibraryPage() {
  const toast = useToast();
  const { can } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [meta, setMeta] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [altText, setAltText] = useState("");
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ per_page: "24", page: String(page) });
      if (search) query.set("search", search);
      if (showTrashed) query.set("trashed", "1");

      const { data, meta: pageMeta } = await apiRequest<MediaItem[]>(`/admin/media?${query}`, {
        auth: true,
      });

      setItems(data);
      setMeta((pageMeta ?? null) as Pagination | null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the media library.");
    } finally {
      setLoading(false);
    }
  }, [page, search, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    let succeeded = 0;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        await apiUpload<MediaItem>("/admin/media", formData);
        succeeded += 1;
      } catch (error) {
        toast.error(
          error instanceof ApiError ? error.message : "Upload failed.",
          file.name,
        );
      }
    }

    setUploading(false);

    if (succeeded > 0) {
      toast.success(`${succeeded} file${succeeded > 1 ? "s" : ""} uploaded successfully.`);
      setPage(1);
      await load();
    }
  };

  const saveDetails = async () => {
    if (editing === null) return;

    setSaving(true);
    try {
      const { message } = await apiRequest<MediaItem>(`/admin/media/${editing.id}`, {
        method: "PATCH",
        auth: true,
        body: { alt_text: altText || null },
      });

      toast.success(message);
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the file details.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/media/${pendingDelete.id}/force`
        : `/admin/media/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the file.");
    } finally {
      setDeleting(false);
    }
  };

  const restore = async (item: MediaItem) => {
    try {
      const { message } = await apiRequest(`/admin/media/${item.id}/restore`, {
        method: "POST",
        auth: true,
      });
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not restore the file.");
    }
  };

  return (
    <>
      <PageBreadcrumb title="Media Library" trail={[{ label: "Engagement" }]} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by file name or alt text"
            data-testid="media-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => {
            setShowTrashed((current) => !current);
            setPage(1);
          }}
          data-testid="media-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>

        {can("media.create") ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              data-testid="media-file-input"
              onChange={(event) => {
                if (event.target.files?.length) void uploadFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
              data-testid="media-upload-button"
            >
              <UploadCloud size={16} />
              Upload files
            </Button>
          </>
        ) : null}
      </div>

      <div
        className="rounded-2xl border border-admin-gray-200 bg-admin-white p-5 dark:border-admin-gray-800 dark:bg-admin-gray-900"
        data-testid="media-library"
      >
        {loading ? (
          <div className="flex justify-center py-20" data-testid="media-loading">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title={showTrashed ? "Trash is empty" : "No files yet"}
            message={
              showTrashed
                ? "Deleted files show up here and can be restored."
                : "Upload images and documents to reuse them across the site."
            }
            testId="media-empty-state"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {items.map((item) => {
              const isImage = item.mime_type.startsWith("image/");

              return (
                <div
                  key={item.id}
                  data-testid={`media-card-${item.id}`}
                  className="group overflow-hidden rounded-xl border border-admin-gray-200 dark:border-admin-gray-800"
                >
                  <div className="relative aspect-4/3 bg-admin-gray-100 dark:bg-admin-gray-800">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.alt_text ?? item.original_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-admin-gray-400">
                        <FileText size={26} />
                      </span>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-admin-gray-900/60 opacity-0 transition-opacity group-hover:opacity-100">
                      {showTrashed ? (
                        <button
                          type="button"
                          onClick={() => void restore(item)}
                          aria-label="Restore file"
                          data-testid={`media-restore-button-${item.id}`}
                          className="rounded-lg bg-admin-white p-2 text-success-500"
                        >
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(item);
                            setAltText(item.alt_text ?? "");
                          }}
                          data-testid={`media-edit-button-${item.id}`}
                          className="rounded-lg bg-admin-white px-3 py-1.5 text-xs font-medium text-admin-gray-800"
                        >
                          Details
                        </button>
                      )}

                      {can("media.delete") ? (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(item)}
                          aria-label="Delete file"
                          data-testid={`media-delete-button-${item.id}`}
                          className="rounded-lg bg-admin-white p-2 text-error-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="px-3 py-2.5">
                    <p className="truncate text-xs font-medium text-admin-gray-700 dark:text-admin-gray-300">
                      {item.original_name}
                    </p>
                    <p className="text-[11px] text-admin-gray-400">
                      {formatBytes(item.size)}
                      {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta && meta.last_page > 1 ? (
          <div
            className="mt-6 flex items-center justify-between border-t border-admin-gray-200 pt-4 dark:border-admin-gray-800"
            data-testid="media-pagination"
          >
            <span className="text-xs text-admin-gray-500 dark:text-admin-gray-400">
              Page {meta.current_page} of {meta.last_page} · {meta.total} files
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((current) => current - 1)}
                data-testid="media-previous-page-button"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((current) => current + 1)}
                data-testid="media-next-page-button"
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={editing !== null}
        title="File details"
        description={editing?.original_name}
        onClose={() => setEditing(null)}
        size="sm"
        testId="media-details-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} data-testid="media-details-cancel-button">
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void saveDetails()} data-testid="media-details-save-button">
              Save
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="flex flex-col gap-4">
            {editing.mime_type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={editing.url}
                alt={editing.alt_text ?? editing.original_name}
                className="max-h-52 w-full rounded-xl object-contain"
              />
            ) : null}

            <Field label="Alt text" hint="Describe the image for search engines and screen readers.">
              <TextInput
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder="Portfolio cover for Sentraoto"
                data-testid="media-alt-text-input"
              />
            </Field>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-admin-gray-500 dark:text-admin-gray-400">Size</dt>
                <dd className="text-admin-gray-800 dark:text-admin-white/90">{formatBytes(editing.size)}</dd>
              </div>
              <div>
                <dt className="text-admin-gray-500 dark:text-admin-gray-400">Type</dt>
                <dd className="text-admin-gray-800 dark:text-admin-white/90">{editing.mime_type}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete file permanently" : "Move file to trash"}
        message={
          showTrashed
            ? `“${pendingDelete?.original_name}” and its stored file will be removed for good. This cannot be undone.`
            : `“${pendingDelete?.original_name}” will be moved to the trash. You can restore it later.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="media-delete-dialog"
      />
    </>
  );
}
