import type { InputHTMLAttributes } from "react";
import { forwardRef, useId } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", ...props }, ref) => {
    const id = useId();

    return (
      <label
        htmlFor={id}
        className={`
          flex items-center gap-2 
          font-semibold text-[14px] leading-[100%] tracking-[0%]
          bg-white p-2 rounded
          ${className}
        `}
      >
        <input
          id={id}
          type="checkbox"
          ref={ref}
          className="w-4 h-4 accent-blue-500 rounded"
          {...props}
        />
        {label}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;