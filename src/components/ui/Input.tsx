import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";
import type { IconType } from "react-icons";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconType;
  rightElement?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  variant?: "default" | "white";
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
      id,
      required,
      variant = "default",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const variants = {
      default: {
        input:
          "bg-brand-700 border-brand-700 text-white focus:border-brand-100",
        label:
          "text-white/50 peer-focus:text-white/70 peer-[:not(:placeholder-shown)]:text-white/70",
      },
      white: {
        input:
          "bg-white border-[#084E80] text-[#084E80] focus:border-[#084E80]",
        label:
          "text-[#084E80]/60 peer-focus:text-[#084E80]/80 peer-[:not(:placeholder-shown)]:text-[#084E80]/80",
      },
    };

    const current = variants[variant];

    return (
      <div className={`flex w-full flex-col gap-2 ${containerClassName}`}>
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            required={required}
            placeholder=" "
            className={`
              peer w-full border-2 px-8 pb-1 pt-6 outline-none transition-all duration-200 placeholder:text-transparent
              ${rightElement ? "pr-14" : ""}
              ${error ? "border-red-500 focus:border-red-500" : current.input}
              ${className}
            `}
            {...props}
          />

          {label && (
            <label
              htmlFor={inputId}
              className={`
                pointer-events-none absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-1.5
                text-base uppercase transition-all duration-200
                [&>svg]:size-6
                peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs
                peer-[:not(:placeholder-shown)]:top-2
                peer-[:not(:placeholder-shown)]:translate-y-0
                peer-[:not(:placeholder-shown)]:text-xs
                peer-focus:[&>svg]:size-4
                peer-[:not(:placeholder-shown)]:[&>svg]:size-4
                ${current.label}
                ${labelClassName}
              `}
            >
              {Icon && <Icon className="mb-0.5" />}
              {label}
              {required && <span className="ml-1 text-red-400">*</span>}
            </label>
          )}

          {rightElement && (
            <div className="absolute right-5 top-1/2 z-10 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <span className="text-sm font-semibold text-red-400">{error}</span>
        ) : hint ? (
          <span className="text-sm text-gray-500">{hint}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
