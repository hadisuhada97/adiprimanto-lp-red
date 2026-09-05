"use client";

import { ImageOff, Loader2, Search, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, apiUpload, ApiError } from "@/app/lib/admin/api-client";
import { useToast } from "@/app/lib/admin/toast";
import { formatBytes, type MediaItem } from "@/app/lib/admin/types";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { EmptyState } from "./ui/Table";

export default function MediaPicker({
  open,
  onClose,
  onSelect,
  selectedId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  selectedId?: string | null;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ per_page: "24", type: "image" });
        if (term) query.set("search", term);

        const { data } = await apiRequest<MediaItem[]>(`/admin/media?${query}`, { auth: true });
        setItems(data);
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : "Could not load the media library.");
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (open) void load(search);
  }, [open, search, load]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, message } = await apiUpload<MediaItem>("/admin/media", formData);
      toast.success(message);
      onSelect(data);
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Media library"
      description="Pick an existing image or upload a new one."
      onClose={onClose}
      size="lg"
      testId="media-picker-modal"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files"
            data-testid="media-picker-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          data-testid="media-picker-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
        <Button
          variant="secondary"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
          data-testid="media-picker-upload-button"
        >
          <UploadCloud size={16} />
          Upload
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16" data-testid="media-picker-loading">
          <Loader2 size={22} className="animate-spin text-brand-500" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="No images yet"
          message="Upload your first image to start building the library."
          testId="media-picker-empty"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                onClose();
              }}
              data-testid={`media-picker-item-${item.id}`}
              className={`group overflow-hidden rounded-xl border text-left transition-colors ${
                selectedId === item.id
                  ? "border-brand-500 ring-2 ring-brand-500/30"
                  : "border-admin-gray-200 hover:border-brand-400 dark:border-admin-gray-800"
              }`}
            >
              <span className="block aspect-4/3 bg-admin-gray-100 dark:bg-admin-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail_url ?? item.url}
                  alt={item.alt_text ?? item.original_name}
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="block px-3 py-2">
                <span className="block truncate text-xs font-medium text-admin-gray-700 dark:text-admin-gray-300">
                  {item.original_name}
                </span>
                <span className="block text-[11px] text-admin-gray-400">{formatBytes(item.size)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
