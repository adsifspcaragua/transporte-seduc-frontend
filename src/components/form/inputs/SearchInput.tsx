import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "@/utils/cn";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  containerClassName?: string;
  iconClassName?: string;
  onClear?: () => void;
};

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className = "",
      containerClassName = "",
      iconClassName = "",
      onClear,
      placeholder = "Pesquisar...",
      disabled,
      value,
      ...props
    },
    ref,
  ) => {
    const showClearButton =
      !disabled &&
      Boolean(onClear) &&
      (typeof value === "string" || typeof value === "number") &&
      String(value).length > 0;

    return (
      <div
        className={cn(
          "group flex h-11 w-full overflow-hidden rounded-lg border-2 border-border-default bg-surface-primary text-content-primary transition-colors duration-200 focus-within:border-brand-600",
          disabled &&
            "border-field-disabled-border bg-field-disabled-surface shadow-inner shadow-content-disabled/10",
          containerClassName,
        )}
      >
        <span
          className={cn(
            "flex h-full w-11 shrink-0 items-center justify-center border-r border-border-default text-brand-600 transition-colors duration-200 group-focus-within:border-brand-600",
            disabled && "border-field-disabled-border text-content-disabled",
            iconClassName,
          )}
        >
          <Search className="size-4" />
        </span>

        <input
          ref={ref}
          aria-label={props["aria-label"] ?? placeholder}
          className={cn(
            "search-input-native h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-content-muted disabled:cursor-default disabled:text-field-disabled-content",
            className,
          )}
          disabled={disabled}
          placeholder={placeholder}
          type="search"
          value={value}
          {...props}
        />

        {showClearButton && (
          <button
            aria-label="Limpar busca"
            className="mr-2 flex size-6 shrink-0 cursor-pointer items-center justify-center self-center rounded-full text-content-muted transition-colors hover:text-danger-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-600"
            onClick={onClear}
            type="button"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
