import { CircleX } from "lucide-react";
import type { TextareaHTMLAttributes } from "react";
import { forwardRef, useId } from "react";

import { cn } from "@/utils/cn";
import type { InputVariant } from "./Input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  errorClassName?: string;
  hintClassName?: string;
  labelClassName?: string;
  variant?: InputVariant;
};

const variantClasses: Record<
  InputVariant,
  {
    error: string;
    hint: string;
    label: string;
    labelPosition: string;
    state: string;
    textarea: string;
  }
> = {
  dark: {
    textarea:
      "rounded-2xl border-2 bg-brand-700 px-8 pb-4 pt-7 text-base text-content-inverse",
    state: "border-brand-700 focus:border-brand-100",
    labelPosition:
      "left-8 top-6 origin-left -translate-y-1/2 scale-100 text-base peer-focus:top-3 peer-focus:scale-75 peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:scale-75",
    label: "text-content-inverse/70",
    hint: "text-content-inverse/60",
    error: "font-semibold text-danger-600",
  },
  white: {
    textarea: "rounded-lg border-2 bg-surface-primary text-content-primary",
    state: "border-border-default focus:border-brand-600",
    labelPosition:
      "left-3 top-6 -translate-y-1/2 text-sm peer-focus:top-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs",
    label:
      "bg-surface-primary text-content-muted peer-focus:text-brand-600 peer-[:not(:placeholder-shown)]:text-brand-600",
    hint: "text-content-muted",
    error: "font-medium text-danger-700",
  },
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      variant = "white",
      id,
      required,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
        <div className="relative w-full">
          <textarea
            ref={ref}
            id={textareaId}
            required={required}
            rows={rows}
            placeholder=" "
            data-input-variant={variant}
            className={cn(
              "peer w-full resize-y px-4 py-3 text-sm outline-none transition-colors duration-200 placeholder:text-transparent disabled:cursor-default disabled:border-field-disabled-border disabled:bg-field-disabled-surface disabled:text-field-disabled-content disabled:shadow-inner disabled:shadow-content-disabled/10",
              variantClasses[variant].textarea,
              error
                ? "border-danger-600 focus:border-danger-600"
                : variantClasses[variant].state,
              className,
            )}
            {...props}
          />

          {label && (
            <label
              htmlFor={textareaId}
              className={cn(
                "pointer-events-none absolute z-10 flex items-center px-1 transition-all duration-200",
                variantClasses[variant].labelPosition,
                variantClasses[variant].label,
                labelClassName,
              )}
            >
              {label}
              {required && <span className="ml-1 text-danger-600">*</span>}
            </label>
          )}
        </div>

        {error ? (
          <span
            className={cn(
              "flex items-start gap-1.5 text-sm",
              variantClasses[variant].error,
              errorClassName,
            )}
          >
            <CircleX className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </span>
        ) : hint ? (
          <span
            className={cn(
              "text-sm",
              variantClasses[variant].hint,
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

Textarea.displayName = "Textarea";

export default Textarea;
