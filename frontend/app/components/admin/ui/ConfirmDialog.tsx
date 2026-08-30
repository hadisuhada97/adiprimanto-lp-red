"use client";

import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
  testId,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testId: string;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      testId={testId}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} data-testid={`${testId}-cancel-button`}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            data-testid={`${testId}-confirm-button`}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-500/10 text-error-500">
          <AlertTriangle size={20} />
        </span>
        <p className="text-sm leading-relaxed text-admin-gray-600 dark:text-admin-gray-300">
          {message}
        </p>
      </div>
    </Modal>
  );
}
