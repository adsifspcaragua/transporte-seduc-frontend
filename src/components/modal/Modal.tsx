"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/buttons";
import { cn } from "@/utils/cn";

type ModalSaveVariant = "primary" | "danger";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave?: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  saveVariant?: ModalSaveVariant;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  hideSave?: boolean;
  className?: string;
  contentClassName?: string;
};

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
  titleId: string;
};

type ModalContentProps = {
  children: ReactNode;
  className?: string;
};

type ModalFooterProps = {
  cancelLabel: string;
  saveLabel: string;
  saveVariant?: ModalSaveVariant;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  hideSave?: boolean;
  onClose: () => void;
  onSave?: () => void;
};

function ModalHeader({ title, onClose, titleId }: ModalHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border-subtle px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-base font-bold text-brand-600">
          {title}
        </h2>
        <button
          aria-label="Fechar modal"
          className="flex size-9 cursor-pointer items-center justify-center rounded-md text-content-muted transition-colors hover:bg-surface-muted hover:text-content-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          onClick={onClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>
    </header>
  );
}

function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-5", className)}>
      {children}
    </div>
  );
}

function ModalFooter({
  cancelLabel,
  saveLabel,
  saveVariant = "primary",
  saveLoading,
  saveDisabled,
  hideSave = false,
  onClose,
  onSave,
}: ModalFooterProps) {
  return (
    <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-border-subtle px-5 py-4 sm:flex-row sm:justify-end">
      <Button
        className="min-h-10 px-4 py-2 text-sm"
        fullWidth={false}
        onClick={onClose}
        variant="ghost"
      >
        {cancelLabel}
      </Button>
      {!hideSave && (
        <Button
          className="min-h-10 px-4 py-2 text-sm"
          disabled={saveDisabled}
          fullWidth={false}
          loading={saveLoading}
          onClick={onSave}
          variant={saveVariant}
        >
          {saveLabel}
        </Button>
      )}
    </footer>
  );
}

export function ModalTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-base font-bold text-brand-700", className)}>
      {children}
    </h3>
  );
}

export function ModalSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-lg border border-border-subtle", className)}
    >
      {children}
    </section>
  );
}

export function ModalSectionHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border-subtle px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function ModalSectionContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-5", className)}>{children}</div>;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  onSave,
  cancelLabel = "Cancelar",
  saveLabel = "Salvar",
  saveVariant = "primary",
  saveLoading = false,
  saveDisabled = false,
  hideSave = false,
  className,
  contentClassName,
}: ModalProps) {
  const titleId = useId();

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
        className="absolute inset-0 cursor-default bg-overlay/45"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-md bg-surface-primary shadow-[0_18px_50px_var(--color-modal-shadow)]",
          className,
        )}
        role="dialog"
      >
        <ModalHeader onClose={onClose} title={title} titleId={titleId} />
        <ModalContent className={contentClassName}>{children}</ModalContent>
        <ModalFooter
          cancelLabel={cancelLabel}
          onClose={onClose}
          onSave={onSave}
          hideSave={hideSave}
          saveDisabled={saveDisabled}
          saveLabel={saveLabel}
          saveLoading={saveLoading}
          saveVariant={saveVariant}
        />
      </section>
    </div>,
    document.body,
  );
}
