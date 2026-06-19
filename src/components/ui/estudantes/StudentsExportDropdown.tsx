"use client";

import { FileSpreadsheet, FileText, MoreVertical, Table } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/buttons";

type ExportOption = {
  icon: ReactNode;
  label: string;
};

const exportOptions: ExportOption[] = [
  { icon: <FileText />, label: "PDF" },
  { icon: <FileSpreadsheet />, label: "Excel (.xlsx)" },
  { icon: <Table />, label: "CSV" },
];

export function StudentsExportDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
        onClick={() => setIsOpen((currentValue) => !currentValue)}
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
                className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-brand-100/45 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-600"
                key={option.label}
                role="menuitem"
                type="button"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-brand-100 text-brand-600 [&>svg]:size-4">
                  {option.icon}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
