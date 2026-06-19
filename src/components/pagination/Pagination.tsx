import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/utils/cn";

type PaginationItem = "end-ellipsis" | "start-ellipsis" | number;

type PaginationProps = {
  currentPage: number;
  from: number | null;
  lastPage: number;
  perPage: number;
  perPageOptions?: number[];
  to: number | null;
  total: number;
  className?: string;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

function getPageItems(currentPage: number, lastPage: number): PaginationItem[] {
  if (lastPage <= 8) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 6, "end-ellipsis", lastPage - 1, lastPage];
  }

  if (currentPage >= lastPage - 3) {
    return [
      1,
      2,
      "start-ellipsis",
      lastPage - 5,
      lastPage - 4,
      lastPage - 3,
      lastPage - 2,
      lastPage - 1,
      lastPage,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    lastPage,
  ];
}

function getResultsLabel(
  from: number | null,
  to: number | null,
  total: number,
) {
  if (total === 0) return "Nenhum resultado encontrado.";

  return `Mostrando ${from ?? 0} até ${to ?? 0} de ${total} resultados`;
}

export default function Pagination({
  currentPage,
  disabled = false,
  from,
  lastPage,
  perPage,
  perPageOptions = [10, 15, 20, 30],
  to,
  total,
  className = "",
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  if (total <= 10) return null;

  const safeLastPage = Math.max(lastPage, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeLastPage);
  const pageItems = getPageItems(safeCurrentPage, safeLastPage);
  const isPreviousDisabled = disabled || safeCurrentPage <= 1;
  const isNextDisabled = disabled || safeCurrentPage >= safeLastPage;
  const shouldShowPageButtons = safeLastPage > 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-t border-border-default bg-white px-5 py-4 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <p className="text-sm font-medium text-content-secondary">
        {getResultsLabel(from, to, total)}
      </p>

      <nav
        aria-label="Paginação"
        className="flex flex-wrap items-center justify-start gap-3 md:justify-end"
      >
        <label className="flex h-10 items-center gap-2 text-sm font-medium text-content-secondary">
          <span>Por página</span>
          <select
            className="h-10 cursor-pointer rounded-lg border border-border-default bg-white px-3 text-sm font-semibold text-content-secondary outline-none transition-colors hover:border-brand-600 focus:border-brand-600 disabled:cursor-default disabled:text-content-disabled"
            disabled={disabled}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
            value={perPage}
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {shouldShowPageButtons && (
          <div className="inline-flex overflow-hidden rounded-lg border border-border-default bg-white shadow-sm">
            <button
              aria-label="Página anterior"
              className="flex h-10 min-w-10 cursor-pointer items-center justify-center text-content-secondary transition-colors hover:bg-brand-100/45 hover:text-brand-600 disabled:cursor-default disabled:bg-white disabled:text-content-disabled"
              disabled={isPreviousDisabled}
              onClick={() => onPageChange(safeCurrentPage - 1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>

            {pageItems.map((item) => {
              if (typeof item !== "number") {
                return (
                  <span
                    className="flex h-10 min-w-10 items-center justify-center border-l border-border-default px-3 text-sm font-semibold text-content-secondary"
                    key={item}
                  >
                    ...
                  </span>
                );
              }

              const isActive = item === safeCurrentPage;

              return (
                <button
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-10 min-w-10 cursor-pointer items-center justify-center border-l border-border-default px-3 text-sm font-semibold transition-colors disabled:cursor-default disabled:text-content-disabled",
                    isActive
                      ? "bg-brand-600 text-white hover:bg-brand-600"
                      : "bg-white text-content-secondary hover:bg-brand-100/45 hover:text-brand-600",
                  )}
                  disabled={disabled}
                  key={item}
                  onClick={() => onPageChange(item)}
                  type="button"
                >
                  {item}
                </button>
              );
            })}

            <button
              aria-label="Próxima página"
              className="flex h-10 min-w-10 cursor-pointer items-center justify-center border-l border-border-default text-content-secondary transition-colors hover:bg-brand-100/45 hover:text-brand-600 disabled:cursor-default disabled:bg-white disabled:text-content-disabled"
              disabled={isNextDisabled}
              onClick={() => onPageChange(safeCurrentPage + 1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}
