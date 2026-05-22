import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";

import { cn } from "@/utils/cn";

export type InputVariant = "dark" | "white";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: ReactNode;
  containerClassName?: string;
  errorClassName?: string;
  hintClassName?: string;
  labelClassName?: string;
  rightElementClassName?: string;
  variant?: InputVariant;
};

const variantClasses: Record<
  InputVariant,
  {
    input: string;
    state: string;
    labelPosition: string;
    label: string;
    hint: string;
  }
> = {
  dark: {
    input:
      "h-14 rounded-full border-2 bg-brand-700 px-8 pb-1 pt-6 text-base text-white",
    state: "border-brand-700 focus:border-brand-100",
    labelPosition:
      "left-8 top-1/2 -translate-y-1/2 text-base uppercase peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs",
    label: `
      text-white/50
      peer-focus:text-white/70
      peer-[:not(:placeholder-shown)]:text-white/70
    `,
    hint: "text-white/60",
  },
  white: {
    input: "rounded-lg border-2 bg-white text-slate-900",
    state: "border-slate-300 focus:border-brand-600",
    labelPosition:
      "left-3 top-1/2 -translate-y-1/2 text-sm peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs",
    label: `
      text-slate-500
      peer-focus:bg-white
      peer-focus:text-brand-600
      peer-[:not(:placeholder-shown)]:bg-white
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
      rightElement,
      className = "",
      containerClassName = "",
      errorClassName = "",
      hintClassName = "",
      labelClassName = "",
      rightElementClassName = "",
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
              "peer h-12 w-full px-4 py-0 text-sm outline-none transition-colors duration-200 placeholder:text-transparent disabled:cursor-not-allowed disabled:opacity-60",
              variantClasses[variant].input,
              error
                ? "border-red-500 focus:border-red-500"
                : variantClasses[variant].state,
              Boolean(rightElement) && "pr-12",
              className,
            )}
            {...props}
          />

          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "pointer-events-none absolute z-10 flex items-center px-1 transition-all duration-200",
                variantClasses[variant].labelPosition,
                variantClasses[variant].label,
                error &&
                  (variant === "dark"
                    ? "text-red-300 peer-focus:text-red-300 peer-[:not(:placeholder-shown)]:text-red-300"
                    : "text-red-500 peer-focus:text-red-500 peer-[:not(:placeholder-shown)]:text-red-500"),
                labelClassName,
              )}
            >
              {label}
              {required && <span className="ml-1 text-red-400">*</span>}
            </label>
          )}

          {rightElement && (
            <div
              className={cn(
                "absolute right-4 top-1/2 z-10 -translate-y-1/2",
                rightElementClassName,
              )}
            >
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <span className={cn("text-sm text-red-400", errorClassName)}>
            {error}
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

Input.displayName = "Input";

export default Input;
