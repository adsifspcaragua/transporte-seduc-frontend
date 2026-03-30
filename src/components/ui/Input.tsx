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
            ...props
        },
        ref
    ) => {
        const generatedId = useId();
        const inputId = id ?? generatedId;

        return (
            <div className={`flex w-full flex-col gap-2 ${containerClassName}`}>
                <div className="relative w-full">
                    <input
                        ref={ref}
                        id={inputId}
                        required={required}
                        placeholder=" "
                        className={`peer w-full rounded-full border-2 bg-brand-700 px-8 pb-1 pt-6 text-white outline-none transition-all duration-200 placeholder:text-transparent
                            ${rightElement ? "pr-14" : ""}
                            ${
                                error
                                    ? "border-red-500 focus:border-red-500"
                                    : "border-brand-700 focus:border-brand-100"
                            }
                            ${className}
                        `}
                        {...props}
                    />

                    {label && (
                        <label
                            htmlFor={inputId}
                            className={`
                                pointer-events-none absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-1.5
                                text-base uppercase text-white/50 transition-all duration-200
                                [&>svg]:size-6
                                peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-white/70
                                peer-focus:[&>svg]:size-4
                                peer-[:not(:placeholder-shown)]:top-2
                                peer-[:not(:placeholder-shown)]:translate-y-0
                                peer-[:not(:placeholder-shown)]:text-xs
                                peer-[:not(:placeholder-shown)]:text-white/70
                                peer-[:not(:placeholder-shown)]:[&>svg]:size-4
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
                    <span className="text-sm text-red-400">{error}</span>
                ) : hint ? (
                    <span className="text-sm text-white/60">{hint}</span>
                ) : null}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;