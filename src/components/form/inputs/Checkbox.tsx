import { Check } from "lucide-react";
import type { InputHTMLAttributes } from "react";
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
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn("flex flex-col gap-2", containerClassName)}>
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex w-fit cursor-pointer items-center gap-2",
            labelClassName,
          )}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer sr-only"
            {...props}
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
