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
      placeholder = "••••••••",
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
        placeholder={showPassword ? "12345678" : placeholder}
        className={cn(
          variant === "dark"
            ? "pr-16 focus:placeholder:text-content-inverse/40"
            : "focus:placeholder:text-content-muted/55",
          className,
        )}
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
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => setShowPassword((prev) => !prev)}
            className={cn(
              "flex items-center justify-center transition",
              variant === "dark"
                ? "text-content-inverse/70 hover:text-content-inverse"
                : "text-content-muted hover:text-brand-600",
            )}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
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
