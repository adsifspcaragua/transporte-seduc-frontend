"use client";

import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { BiMap } from "react-icons/bi";

import type { InputProps } from "@/components/ui/Input";
import Input from "@/components/ui/Input";
import { cleanCep, formatCep, isValidCep } from "@/lib/utils/cep";

type CepInputProps = Omit<
  InputProps,
  "icon" | "inputMode" | "maxLength" | "onChange" | "type"
> & {
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onCepValidityChange?: (isValid: boolean) => void;
};

function getCepValidationError(value: string, required?: boolean) {
  const cep = cleanCep(value);

  if (!cep.length) {
    return required ? "Este campo é obrigatório." : undefined;
  }

  if (!isValidCep(cep)) {
    return "Informe um CEP completo.";
  }

  return undefined;
}

const CepInput = forwardRef<HTMLInputElement, CepInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onBlur,
      error,
      label = "CEP",
      required,
      onCepValidityChange,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(() =>
      formatCep(defaultValue?.toString() ?? ""),
    );
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();

    const formattedValue = useMemo(
      () => formatCep(isControlled ? (value?.toString() ?? "") : internalValue),
      [internalValue, isControlled, value],
    );

    useEffect(() => {
      if (!isControlled) return;
      setInternalValue(formatCep(value?.toString() ?? ""));
    }, [isControlled, value]);

    useEffect(() => {
      onCepValidityChange?.(isValidCep(formattedValue));
    }, [formattedValue, onCepValidityChange]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const nextFormattedValue = formatCep(event.target.value);

      event.target.value = nextFormattedValue;

      if (!isControlled) {
        setInternalValue(nextFormattedValue);
      }

      if (touched) {
        setInternalError(getCepValidationError(nextFormattedValue, required));
      }

      onChange?.(event);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      setTouched(true);
      setInternalError(getCepValidationError(event.target.value, required));
      onBlur?.(event);
    }

    return (
      <Input
        ref={ref}
        type="text"
        label={label}
        required={required}
        inputMode="numeric"
        autoComplete="postal-code"
        icon={BiMap}
        maxLength={9}
        value={formattedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error ?? internalError}
        {...props}
      />
    );
  },
);

CepInput.displayName = "CepInput";

export default CepInput;
