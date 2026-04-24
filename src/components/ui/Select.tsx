import type { ReactNode, SelectHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import type { IconType } from "react-icons";
import { BiChevronDown } from "react-icons/bi";

import type { InputVariant } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconType;
  containerClassName?: string;
  labelClassName?: string;
  variant?: InputVariant;
  options?: SelectOption[];
  placeholder?: string;
  rightElement?: ReactNode;
};

const variantClasses: Record<
  InputVariant,
  {
    field: string;
    label: string;
    hint: string;
    icon: string;
  }
> = {
  dark: {
    field: "border-brand-700 bg-brand-700 text-white focus:border-brand-100",
    label: "text-white/70",
    hint: "text-white/60",
    icon: "text-white/70",
  },
  white: {
    field: "border-brand-700 bg-white text-brand-700 focus:border-brand-100",
    label: "text-brand-600",
    hint: "text-brand-600/70",
    icon: "text-brand-600/70",
  },
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      containerClassName = "",
      labelClassName = "",
      className = "",
      variant = "dark",
      id,
      required,
      options,
      placeholder = "Selecione",
      children,
      rightElement,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            required={required}
            value={value}
            defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
            className={cn(
              "peer w-full appearance-none rounded-full border-2 px-8 pb-1 pt-6 outline-none transition-all duration-200",
              error
                ? "border-red-500 focus:border-red-500"
                : variantClasses[variant].field,
              "pr-16",
              className,
            )}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            {children}
          </select>

          {label && (
            <label
              htmlFor={selectId}
              className={cn(
                "pointer-events-none absolute left-8 top-2 flex items-center gap-1.5 text-xs uppercase transition-all duration-200 [&>svg]:size-4",
                variantClasses[variant].label,
                labelClassName,
              )}
            >
              {Icon && <Icon className="mb-0.5" />}
              {label}
              {required && <span className="ml-1 text-red-400">*</span>}
            </label>
          )}

          <div
            className={cn(
              "pointer-events-none absolute right-6 top-1/2 z-10 -translate-y-1/2",
              variantClasses[variant].icon,
            )}
          >
            {rightElement ?? <BiChevronDown className="size-5" />}
          </div>
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

Select.displayName = "Select";

export default Select;
