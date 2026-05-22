"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { cn } from "@/utils/cn";
import Input, { type InputProps } from "./Input";

type PasswordInputProps = Omit<InputProps, "rightElement" | "type">;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label = "Senha",
      error,
      hint,
      className = "",
      containerClassName = "",
      labelClassName = "",
      rightElementClassName = "",
      variant = "white",
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        label={label}
        error={error}
        hint={hint}
        className={cn(variant === "dark" && "pr-16", className)}
        containerClassName={containerClassName}
        labelClassName={labelClassName}
        rightElementClassName={cn(
          variant === "dark" && "right-6",
          rightElementClassName,
        )}
        variant={variant}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className={
              variant === "dark"
                ? "flex items-center justify-center text-white/70 transition hover:text-white"
                : "flex items-center justify-center text-slate-500 transition hover:text-brand-600"
            }
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="size-6" />
            ) : (
              <Eye className="size-6" />
            )}
          </button>
        }
        {...props}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
