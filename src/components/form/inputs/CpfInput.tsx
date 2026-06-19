"use client";

import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { cleanCpf, formatCpf, isValidCpf } from "@/utils/cpf";
import Input, { type InputProps } from "./Input";

type CpfInputProps = Omit<
  InputProps,
  "inputMode" | "maxLength" | "onChange" | "type"
> & {
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onCpfValidityChange?: (isValid: boolean) => void;
};

function getCpfValidationError(value: string) {
  const cpf = cleanCpf(value);

  if (!cpf.length) {
    return undefined;
  }

  if (cpf.length < 11) {
    return "Informe um CPF completo.";
  }

  if (!isValidCpf(cpf)) {
    return "Informe um CPF válido.";
  }

  return undefined;
}

function isDeleting(event: ChangeEvent<HTMLInputElement>) {
  const inputType = (event.nativeEvent as InputEvent).inputType;

  return typeof inputType === "string" && inputType.startsWith("delete");
}

const CpfInput = forwardRef<HTMLInputElement, CpfInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onBlur,
      error,
      label = "CPF",
      required,
      onCpfValidityChange,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(() =>
      formatCpf(defaultValue?.toString() ?? ""),
    );
    const [eagerFormatting, setEagerFormatting] = useState(true);
    const [internalError, setInternalError] = useState<string | undefined>();

    const formattedValue = useMemo(
      () =>
        formatCpf(isControlled ? (value?.toString() ?? "") : internalValue, {
          eager: eagerFormatting,
        }),
      [eagerFormatting, internalValue, isControlled, value],
    );

    useEffect(() => {
      if (!isControlled) return;
      setInternalValue(
        formatCpf(value?.toString() ?? "", { eager: eagerFormatting }),
      );
    }, [eagerFormatting, isControlled, value]);

    useEffect(() => {
      const isValid =
        cleanCpf(formattedValue).length === 11 && isValidCpf(formattedValue);
      onCpfValidityChange?.(isValid);
    }, [formattedValue, onCpfValidityChange]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const shouldFormatEagerly = !isDeleting(event);
      const nextFormattedValue = formatCpf(event.target.value, {
        eager: shouldFormatEagerly,
      });

      setEagerFormatting(shouldFormatEagerly);
      event.target.value = nextFormattedValue;

      if (!isControlled) {
        setInternalValue(nextFormattedValue);
      }

      setInternalError(undefined);

      onChange?.(event);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      setInternalError(getCpfValidationError(event.target.value));
      onBlur?.(event);
    }

    return (
      <Input
        ref={ref}
        type="text"
        label={label}
        required={required}
        inputMode="numeric"
        autoComplete="off"
        maxLength={14}
        value={formattedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error ?? internalError}
        {...props}
      />
    );
  },
);

CpfInput.displayName = "CpfInput";

export default CpfInput;
