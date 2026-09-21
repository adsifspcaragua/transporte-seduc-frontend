"use client";

import {
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  MoreVertical,
  Table,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/buttons";
import {
  type EstudanteExportFormat,
  getExportFilename,
} from "@/components/ui/estudantes/estudanteExportPresentation";
import { estudanteService } from "@/services/api/modules/estudante";

type ExportOption = {
  icon: ReactNode;
  label: string;
  value: EstudanteExportFormat;
};

const exportOptions: ExportOption[] = [
  { icon: <FileText />, label: "PDF", value: "pdf" },
  { icon: <FileSpreadsheet />, label: "Excel (.xlsx)", value: "xlsx" },
  { icon: <Table />, label: "CSV", value: "csv" },
];

export function StudentsExportDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<EstudanteExportFormat | null>(
    null,
  );
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  async function exportStudents(format: EstudanteExportFormat) {
    if (exporting) return;

    try {
      setExporting(format);
      setError("");
      const result = await estudanteService.export(format);
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = getExportFilename(result.contentDisposition, format);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setIsOpen(false);
    } catch {
      setError("Não foi possível exportar os estudantes. Tente novamente.");
    } finally {
      setExporting(null);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!dropdownRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Exportar estudantes"
        fullWidth={false}
        leftIcon={<MoreVertical />}
        onClick={() => {
          if (!isOpen) setError("");
          setIsOpen((currentValue) => !currentValue);
        }}
        size="icon"
        variant="primary"
      />

      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 overflow-hidden rounded-lg border border-brand-600/10 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
          role="menu"
        >
          <div className="border-b border-border-default px-5 py-4">
            <h2 className="text-base font-bold text-brand-600">
              Exportar como
            </h2>
          </div>

          <div className="py-2">
            {exportOptions.map((option) => (
              <button
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-brand-100/45 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-600 disabled:cursor-default disabled:opacity-60"
                disabled={Boolean(exporting)}
                key={option.label}
                onClick={() => void exportStudents(option.value)}
                role="menuitem"
                type="button"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-brand-100 text-brand-600 [&>svg]:size-4">
                  {exporting === option.value ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    option.icon
                  )}
                </span>
                {option.label}
              </button>
            ))}
          </div>
          {error && (
            <p
              className="border-t border-danger-600/15 bg-danger-600/5 px-5 py-3 text-xs font-medium text-danger-700"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
