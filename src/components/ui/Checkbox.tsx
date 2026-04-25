import { Check } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { forwardRef, useId } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  labelClassName?: string;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      error,
      hint,
      className = "",
      containerClassName = "",
      labelClassName = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        <label
          htmlFor={inputId}
          className={`inline-flex w-fit cursor-pointer items-center gap-2 ${labelClassName}`}
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={`peer sr-only ${className}`}
            {...props}
          />

          <span
            className="
              flex size-5 items-center justify-center rounded-md
              bg-brand-700 transition-all duration-200
              [&>svg]:size-3 [&>svg]:text-brand-700 [&>svg]:opacity-0 [&>svg]:transition-all [&>svg]:duration-200
              peer-focus:ring-2 peer-focus:ring-brand-100/50
              peer-checked:bg-brand-100
              peer-checked:[&>svg]:opacity-100
            "
          >
            <Check />
          </span>

          {label && <span className="leading-none text-white">{label}</span>}
        </label>

        {error ? (
          <span className="text-sm text-red-400">{error}</span>
        ) : hint ? (
          <span className="text-sm text-white/60">{hint}</span>
        ) : null}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
