"use client";

import { Archive, Ban, CheckCheck, Inbox, Loader2, Mail, MessageCircle, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import PageBreadcrumb from "@/app/components/admin/PageBreadcrumb";
import Button from "@/app/components/admin/ui/Button";
import ConfirmDialog from "@/app/components/admin/ui/ConfirmDialog";
import { Field, TextArea } from "@/app/components/admin/ui/Form";
import { StatusBadge } from "@/app/components/admin/ui/Table";
import { ApiError, apiRequest } from "@/app/lib/admin/api-client";
import { useAuth } from "@/app/lib/admin/auth-context";
import { useToast } from "@/app/lib/admin/toast";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "new" | "read" | "replied" | "spam" | "archived";
  internal_note: string | null;
  ip_address: string | null;
  read_at: string | null;
  replied_at: string | null;
  handler: string | null;
  created_at: string | null;
};

const STATUSES = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "spam", label: "Spam" },
  { value: "archived", label: "Archived" },
] as const;

const TONE: Record<Message["status"], "brand" | "success" | "neutral" | "warning"> = {
  new: "brand",
  read: "neutral",
  replied: "success",
  spam: "warning",
  archived: "neutral",
};

export default function InboxPage() {
  const toast = useToast();
  const { can } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (status) query.set("status", status);
      if (search) query.set("search", search);
      if (showTrashed) query.set("trashed", "1");

      const [list, summary] = await Promise.all([
        apiRequest<Message[]>(`/admin/contact-messages?${query}`, { auth: true }),
        apiRequest<{ unread: number }>("/admin/contact-messages/summary", { auth: true }),
      ]);

      setMessages(list.data);
      setUnread(summary.data.unread);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load the inbox.");
    } finally {
      setLoading(false);
    }
  }, [status, search, showTrashed, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = async (message: Message) => {
    try {
      const { data } = await apiRequest<Message>(`/admin/contact-messages/${message.id}`, { auth: true });
      setSelected(data);
      setNote(data.internal_note ?? "");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not open the message.");
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, savingNoteFlag = false) => {
    if (savingNoteFlag) setSavingNote(true);
    try {
      const { data, message } = await apiRequest<Message>(`/admin/contact-messages/${id}`, {
        method: "PATCH",
        auth: true,
        body,
      });
      setSelected(data);
      toast.success(message);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update the message.");
    } finally {
      if (savingNoteFlag) setSavingNote(false);
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null) return;

    setDeleting(true);
    try {
      const path = showTrashed
        ? `/admin/contact-messages/${pendingDelete.id}/force`
        : `/admin/contact-messages/${pendingDelete.id}`;
      const { message } = await apiRequest(path, { method: "DELETE", auth: true });

      toast.success(message);
      if (selected?.id === pendingDelete.id) setSelected(null);
      setPendingDelete(null);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete the message.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageBreadcrumb title="Inbox" trail={[{ label: "Engagement" }]} />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-1 rounded-lg bg-admin-gray-100 p-1 dark:bg-admin-gray-800" data-testid="inbox-status-filter">
          {STATUSES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              data-testid={`inbox-filter-${option.value === "" ? "all" : option.value}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                status === option.value
                  ? "bg-admin-white text-admin-gray-900 shadow-sm dark:bg-admin-gray-900 dark:text-admin-white/90"
                  : "text-admin-gray-500 hover:text-admin-gray-700 dark:text-admin-gray-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search size={16} className="absolute top-3 left-3.5 text-admin-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email or message"
            data-testid="inbox-search-input"
            className="w-full rounded-lg border border-admin-gray-300 bg-transparent py-2.5 pr-4 pl-10 text-sm text-admin-gray-800 outline-none focus:border-brand-500 dark:border-admin-gray-700 dark:text-admin-white/90"
          />
        </div>

        <span
          className="rounded-full bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-500"
          data-testid="inbox-unread-count"
        >
          {unread} unread
        </span>

        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={() => {
            setShowTrashed((state) => !state);
            setSelected(null);
          }}
          data-testid="inbox-trash-toggle-button"
        >
          <Trash2 size={16} />
          {showTrashed ? "Viewing trash" : "Trash"}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]" data-testid="inbox-page">
        <div className="rounded-2xl border border-admin-gray-200 bg-admin-white dark:border-admin-gray-800 dark:bg-admin-gray-900">
          {loading ? (
            <div className="flex justify-center py-16" data-testid="inbox-loading">
              <Loader2 size={20} className="animate-spin text-brand-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16" data-testid="inbox-empty-state">
              <Inbox size={24} className="text-admin-gray-400" />
              <p className="text-sm text-admin-gray-500 dark:text-admin-gray-400">No messages here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-admin-gray-200 dark:divide-admin-gray-800" data-testid="inbox-list">
              {messages.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => void open(message)}
                    data-testid={`inbox-item-${message.id}`}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-admin-gray-50 dark:hover:bg-admin-gray-800/60 ${
                      selected?.id === message.id ? "bg-brand-500/5" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          message.read_at === null
                            ? "font-semibold text-admin-gray-900 dark:text-admin-white"
                            : "text-admin-gray-700 dark:text-admin-gray-300"
                        }`}
                      >
                        {message.name}
                      </span>
                      <StatusBadge tone={TONE[message.status]}>{message.status}</StatusBadge>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-admin-gray-500 dark:text-admin-gray-400">
                      {message.subject ?? message.message.slice(0, 60)}
                    </span>
                    <span className="mt-1 block text-[11px] text-admin-gray-400">
                      {message.created_at === null ? "" : new Date(message.created_at).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-admin-gray-200 bg-admin-white p-6 dark:border-admin-gray-800 dark:bg-admin-gray-900">
          {selected === null ? (
            <p
              className="py-20 text-center text-sm text-admin-gray-500 dark:text-admin-gray-400"
              data-testid="inbox-detail-placeholder"
            >
              Select a message to read it.
            </p>
          ) : (
            <div data-testid="inbox-detail">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-admin-gray-900 dark:text-admin-white/90">
                    {selected.subject ?? "No subject"}
                  </h3>
                  <p className="mt-1 text-sm text-admin-gray-600 dark:text-admin-gray-300">
                    {selected.name} · {selected.email}
                    {selected.phone === null ? "" : ` · ${selected.phone}`}
                  </p>
                  <p className="mt-0.5 text-xs text-admin-gray-400">
                    {selected.created_at === null ? "" : new Date(selected.created_at).toLocaleString()}
                    {selected.ip_address === null ? "" : ` · IP ${selected.ip_address}`}
                    {selected.handler === null ? "" : ` · handled by ${selected.handler}`}
                  </p>
                </div>
                <StatusBadge tone={TONE[selected.status]}>{selected.status}</StatusBadge>
              </div>

              <p className="mt-5 rounded-xl bg-admin-gray-50 p-4 text-sm whitespace-pre-line text-admin-gray-700 dark:bg-admin-gray-800/50 dark:text-admin-gray-300">
                {selected.message}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${(selected.phone ?? "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="inbox-reply-whatsapp"
                  className={`inline-flex items-center gap-2 rounded-lg border border-admin-gray-300 px-4 py-2.5 text-sm font-medium text-admin-gray-700 transition-colors hover:border-brand-500 hover:text-brand-500 dark:border-admin-gray-700 dark:text-admin-gray-300 ${
                    selected.phone === null ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <MessageCircle size={16} />
                  Reply on WhatsApp
                </a>

                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject ?? "Your message")}`}
                  data-testid="inbox-reply-email"
                  className="inline-flex items-center gap-2 rounded-lg border border-admin-gray-300 px-4 py-2.5 text-sm font-medium text-admin-gray-700 transition-colors hover:border-brand-500 hover:text-brand-500 dark:border-admin-gray-700 dark:text-admin-gray-300"
                >
                  <Mail size={16} />
                  Reply by email
                </a>

                {can("contact_messages.update") && !showTrashed ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => void patch(selected.id, { status: "replied" })}
                      data-testid="inbox-mark-replied-button"
                    >
                      <CheckCheck size={16} />
                      Mark replied
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void patch(selected.id, { status: "spam" })}
                      data-testid="inbox-mark-spam-button"
                    >
                      <Ban size={16} />
                      Spam
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => void patch(selected.id, { status: "archived" })}
                      data-testid="inbox-archive-button"
                    >
                      <Archive size={16} />
                      Archive
                    </Button>
                  </>
                ) : null}

                {showTrashed ? (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const { message } = await apiRequest(
                          `/admin/contact-messages/${selected.id}/restore`,
                          { method: "POST", auth: true },
                        );
                        toast.success(message);
                        setSelected(null);
                        await load();
                      } catch (error) {
                        toast.error(error instanceof ApiError ? error.message : "Could not restore.");
                      }
                    }}
                    data-testid="inbox-restore-button"
                  >
                    <RotateCcw size={16} />
                    Restore
                  </Button>
                ) : null}

                {can("contact_messages.delete") ? (
                  <Button
                    variant="secondary"
                    onClick={() => setPendingDelete(selected)}
                    data-testid="inbox-delete-button"
                  >
                    <Trash2 size={16} />
                    {showTrashed ? "Delete permanently" : "Move to trash"}
                  </Button>
                ) : null}
              </div>

              {can("contact_messages.update") ? (
                <div className="mt-6">
                  <Field label="Internal note" hint="Only visible to your team" testId="inbox-note-field">
                    <TextArea
                      rows={3}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      data-testid="inbox-note-input"
                    />
                  </Field>
                  <div className="mt-3 flex justify-end">
                    <Button
                      loading={savingNote}
                      onClick={() => void patch(selected.id, { internal_note: note || null }, true)}
                      data-testid="inbox-note-save-button"
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={showTrashed ? "Delete permanently" : "Move to trash"}
        message={
          showTrashed
            ? `The message from “${pendingDelete?.name}” will be removed for good.`
            : `The message from “${pendingDelete?.name}” will be moved to the trash.`
        }
        confirmLabel={showTrashed ? "Delete permanently" : "Move to trash"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
        testId="inbox-delete-dialog"
      />
    </>
  );
}
