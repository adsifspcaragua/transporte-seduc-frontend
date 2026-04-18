"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef, useState } from "react";
import { IoIosEye, IoIosEyeOff, IoIosLock } from "react-icons/io";
import Input from "./Input";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  labelClassName?: string;
};

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
        icon={IoIosLock}
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
              <IoIosEyeOff className="size-6" />
            ) : (
              <IoIosEye className="size-6" />
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
