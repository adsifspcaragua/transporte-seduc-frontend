"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Fragment, type Key, type ReactNode } from "react";

import { Button } from "@/components/buttons";
import { Skeleton } from "@/components/loading";
import { Pagination } from "@/components/pagination";
import { cn } from "@/utils/cn";

export type DataTableColumn = {
  headerClassName?: string;
  key: string;
  label: ReactNode;
};

export type DataTablePaginationProps = {
  currentPage: number;
  disabled?: boolean;
  from: number | null;
  lastPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPage: number;
  to: number | null;
  total: number;
};

export type DataTableProps<TData> = {
  columns: DataTableColumn[];
  data: TData[];
  emptyMessage?: string;
  errorMessage?: string;
  errorTitle?: string;
  getRowKey: (row: TData) => Key;
  gridClassName: string;
  headerClassName?: string;
  loading?: boolean;
  onRetry?: () => void;
  pagination?: DataTablePaginationProps;
  retryLabel?: string;
  renderRow: (row: TData) => ReactNode;
  skeleton?: ReactNode;
  tableClassName?: string;
};

export default function DataTable<TData>({
  columns,
  data,
  emptyMessage = "Nenhum registro encontrado.",
  errorMessage = "",
  errorTitle = "Não foi possível carregar os registros",
  getRowKey,
  gridClassName,
  headerClassName = "",
  loading = false,
  onRetry,
  pagination,
  retryLabel = "Tentar novamente",
  renderRow,
  skeleton,
  tableClassName = "",
}: DataTableProps<TData>) {
  const hasError = Boolean(errorMessage);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-md bg-white shadow-[0_3px_12px_rgba(0,0,0,0.2)]",
        tableClassName,
      )}
    >
      <div
        className={cn(
          "hidden bg-brand-600 px-5 py-3 text-xs font-semibold text-white md:grid",
          gridClassName,
          headerClassName,
        )}
      >
        {columns.map((column) => (
          <span className={column.headerClassName} key={column.key}>
            {column.label}
          </span>
        ))}
      </div>

      <Skeleton fallback={skeleton} loading={loading}>
        <div>
          {hasError ? (
            <div
              className="flex flex-col items-center gap-4 px-5 py-14 text-center"
              role="alert"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-danger-600/10 text-danger-600">
                <AlertCircle className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-950">
                  {errorTitle}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {errorMessage}
                </p>
              </div>
              {onRetry && (
                <Button
                  className="min-h-9 rounded px-4 py-1 text-sm"
                  fullWidth={false}
                  leftIcon={<RefreshCw />}
                  onClick={onRetry}
                  size="sm"
                  variant="secondary"
                >
                  {retryLabel}
                </Button>
              )}
            </div>
          ) : data.length === 0 ? (
            <div className="px-5 py-14 text-center text-sm font-medium text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            data.map((row) => (
              <Fragment key={getRowKey(row)}>{renderRow(row)}</Fragment>
            ))
          )}
        </div>
      </Skeleton>

      {pagination && <Pagination {...pagination} />}
    </section>
  );
}
