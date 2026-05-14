import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";

import { cn } from "@/lib/utils/cn";

export type InputVariant = "dark" | "white";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  variant?: InputVariant;
};

const variantClasses: Record<
  InputVariant,
  {
    input: string;
    state: string;
    label: string;
    hint: string;
  }
> = {
  dark: {
    input: "rounded-full border-2 bg-brand-700 text-white",
    state: "border-brand-700 focus:border-brand-100",
    label: `
      text-white/50
      peer-focus:text-white/70
      peer-[:not(:placeholder-shown)]:text-white/70
    `,
    hint: "text-white/60",
  },
  white: {
    input: "rounded-lg border bg-white text-slate-900",
    state:
      "border-slate-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
    label: `
      text-slate-500
      peer-focus:text-brand-600
      peer-[:not(:placeholder-shown)]:text-brand-600
    `,
    hint: "text-slate-500",
  },
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      rightElement,
      className = "",
      containerClassName = "",
      labelClassName = "",
      variant = "white",
      id,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            required={required}
            placeholder=" "
            data-input-variant={variant}
            className={cn(
              "peer w-full px-8 pb-1 pt-6 outline-none transition-all duration-200 placeholder:text-transparent disabled:cursor-not-allowed disabled:opacity-60",
              variantClasses[variant].input,
              error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : variantClasses[variant].state,
              Boolean(rightElement) && "pr-16",
              className,
            )}
            {...props}
          />

          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "pointer-events-none absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-base uppercase transition-all duration-200 [&>svg]:size-6 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:[&>svg]:size-4 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:[&>svg]:size-4",
                variantClasses[variant].label,
                labelClassName,
              )}
            >
              {Icon && <Icon className="mb-0.5" />}
              {label}
              {required && <span className="ml-1 text-red-400">*</span>}
            </label>
          )}

          {rightElement && (
            <div className="absolute right-6 top-1/2 z-10 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <span className="text-sm text-red-400">{error}</span>
        ) : hint ? (
          <span className={cn("text-sm", variantClasses[variant].hint)}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
