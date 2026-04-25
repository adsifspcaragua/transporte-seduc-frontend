"use client";

import { IdCard } from "lucide-react";
import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { forwardRef, useEffect, useMemo, useState } from "react";

import type { InputProps } from "@/components/ui/Input";
import Input from "@/components/ui/Input";
import { cleanCpf, formatCpf, isValidCpf } from "@/lib/utils/cpf";

type CpfInputProps = Omit<
  InputProps,
  "icon" | "inputMode" | "maxLength" | "onChange" | "type"
> & {
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onCpfValidityChange?: (isValid: boolean) => void;
};

function getCpfValidationError(value: string, required?: boolean) {
  const cpf = cleanCpf(value);

  if (!cpf.length) {
    return required ? "Este campo é obrigatório." : undefined;
  }

  if (cpf.length < 11) {
    return "Informe um CPF completo.";
  }

  if (!isValidCpf(cpf)) {
    return "Informe um CPF válido.";
  }

  return undefined;
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
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();

    const formattedValue = useMemo(
      () => formatCpf(isControlled ? (value?.toString() ?? "") : internalValue),
      [internalValue, isControlled, value],
    );

    useEffect(() => {
      if (!isControlled) return;
      setInternalValue(formatCpf(value?.toString() ?? ""));
    }, [isControlled, value]);

    useEffect(() => {
      const isValid =
        cleanCpf(formattedValue).length === 11 && isValidCpf(formattedValue);
      onCpfValidityChange?.(isValid);
    }, [formattedValue, onCpfValidityChange]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const nextFormattedValue = formatCpf(event.target.value);

      event.target.value = nextFormattedValue;

      if (!isControlled) {
        setInternalValue(nextFormattedValue);
      }

      if (touched) {
        setInternalError(getCpfValidationError(nextFormattedValue, required));
      }

      onChange?.(event);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      setTouched(true);
      setInternalError(getCpfValidationError(event.target.value, required));
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
        icon={IdCard}
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
