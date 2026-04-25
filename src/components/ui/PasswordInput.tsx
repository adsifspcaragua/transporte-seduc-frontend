"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import Input, { type InputProps } from "./Input";

type PasswordInputProps = Omit<InputProps, "icon" | "rightElement" | "type">;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label = "Senha",
      error,
      hint,
      containerClassName = "",
      labelClassName = "",
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
        containerClassName={containerClassName}
        labelClassName={labelClassName}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="flex items-center justify-center text-white/70 transition hover:text-white"
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
