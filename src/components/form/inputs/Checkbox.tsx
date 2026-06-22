import { Check } from "lucide-react";
import type { InputHTMLAttributes, KeyboardEvent } from "react";
import { forwardRef, useId } from "react";

import { cn } from "@/utils/cn";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  errorClassName?: string;
  hintClassName?: string;
  labelClassName?: string;
  variant?: "dark" | "white";
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      hint,
      className = "",
      containerClassName = "",
      errorClassName = "",
      hintClassName = "",
      labelClassName = "",
      id,
      variant = "white",
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(error);

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);

      if (event.defaultPrevented) return;

      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.click();
      }
    }

    return (
      <div
        className={cn("flex flex-col gap-2", containerClassName)}
        data-field-container={hasError ? "true" : undefined}
      >
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex w-fit cursor-pointer items-center gap-2",
            props.disabled && "cursor-default",
            labelClassName,
          )}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            data-field-error={hasError ? "true" : undefined}
            className="peer sr-only"
            {...props}
            onKeyDown={handleKeyDown}
          />

          <span
            className={cn(
              `
              flex size-5 items-center justify-center rounded-md
              transition-all duration-200
              [&>svg]:size-3 [&>svg]:opacity-0 [&>svg]:transition-all [&>svg]:duration-200
              peer-focus-visible:ring-2
              peer-checked:[&>svg]:opacity-100
            `,
              variant === "dark"
                ? "bg-brand-700 peer-checked:bg-brand-100 peer-focus-visible:ring-brand-100/50 [&>svg]:text-brand-700"
                : "border border-border-default bg-surface-primary peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-focus-visible:ring-focus-muted [&>svg]:text-content-inverse",
              props.disabled &&
                "border-field-disabled-border bg-field-disabled-surface shadow-inner shadow-content-disabled/10 peer-checked:border-field-disabled-border peer-checked:bg-field-disabled-surface [&>svg]:text-field-disabled-content",
              className,
            )}
          >
            <Check />
          </span>

          {label && (
            <span
              className={cn(
                "leading-none",
                variant === "dark"
                  ? "text-content-inverse"
                  : "text-content-secondary",
                props.disabled && "text-field-disabled-content",
              )}
            >
              {label}
            </span>
          )}
        </label>

        {error ? (
          <span className={cn("text-sm text-danger-600", errorClassName)}>
            {error}
          </span>
        ) : hint ? (
          <span
            className={cn(
              "text-sm",
              variant === "dark"
                ? "text-content-inverse/60"
                : "text-brand-600/70",
              hintClassName,
            )}
          >
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
