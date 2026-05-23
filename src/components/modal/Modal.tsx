"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/buttons";
import { cn } from "@/utils/cn";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  className?: string;
  contentClassName?: string;
};

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
};

type ModalContentProps = {
  children: ReactNode;
  className?: string;
};

type ModalFooterProps = {
  cancelLabel: string;
  saveLabel: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  onClose: () => void;
  onSave?: () => void;
};

function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
      <h2 className="text-base font-bold text-brand-600">{title}</h2>
      <button
        aria-label="Fechar modal"
        className="flex size-9 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        onClick={onClose}
        type="button"
      >
        <X className="size-5" />
      </button>
    </header>
  );
}

function ModalContent({ children, className }: ModalContentProps) {
  return <div className={cn("px-5 py-5", className)}>{children}</div>;
}

function ModalFooter({
  cancelLabel,
  saveLabel,
  saveLoading,
  saveDisabled,
  onClose,
  onSave,
}: ModalFooterProps) {
  return (
    <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
      <Button
        className="min-h-10 px-4 py-2 text-sm"
        fullWidth={false}
        onClick={onClose}
        uppercase={false}
        variant="ghost"
      >
        {cancelLabel}
      </Button>
      <Button
        className="min-h-10 px-4 py-2 text-sm"
        disabled={saveDisabled}
        fullWidth={false}
        loading={saveLoading}
        onClick={onSave}
        uppercase={false}
        variant="primary"
      >
        {saveLabel}
      </Button>
    </footer>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
  onSave,
  cancelLabel = "Cancelar",
  saveLabel = "Salvar",
  saveLoading = false,
  saveDisabled = false,
  className,
  contentClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex min-h-screen items-center justify-center p-4">
      <button
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default bg-black/45"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className={cn(
          "relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-hidden rounded-md bg-white shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
          className,
        )}
        role="dialog"
      >
        <ModalHeader onClose={onClose} title={title} />
        <ModalContent className={contentClassName}>{children}</ModalContent>
        <ModalFooter
          cancelLabel={cancelLabel}
          onClose={onClose}
          onSave={onSave}
          saveDisabled={saveDisabled}
          saveLabel={saveLabel}
          saveLoading={saveLoading}
        />
      </section>
    </div>,
    document.body,
  );
}
