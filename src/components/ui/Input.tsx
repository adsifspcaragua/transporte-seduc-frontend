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
    label: string;
    hint: string;
  }
> = {
  dark: {
    input: "bg-brand-700 text-white",
    label: `
      text-white/50
      peer-focus:text-white/70
      peer-[:not(:placeholder-shown)]:text-white/70
    `,
    hint: "text-white/60",
  },
  white: {
    input: "bg-white text-brand-700",
    label: `
      text-brand-600/60
      peer-focus:text-brand-600
      peer-[:not(:placeholder-shown)]:text-brand-600
    `,
    hint: "text-brand-600/70",
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
      variant = "dark",
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
            className={cn(
              "peer w-full rounded-full border-2 px-8 pb-1 pt-6 outline-none transition-all duration-200 placeholder:text-transparent",
              error
                ? "border-red-500 focus:border-red-500"
                : "border-brand-700 focus:border-brand-100",
              Boolean(rightElement) && "pr-16",
              variantClasses[variant].input,
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
