"use client";

import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { cleanCep, formatCep, isValidCep } from "@/utils/cep";
import Input, { type InputProps } from "./Input";

type CepInputProps = Omit<
  InputProps,
  "inputMode" | "maxLength" | "onChange" | "type"
> & {
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onCepValidityChange?: (isValid: boolean) => void;
};

function getCepValidationError(value: string) {
  const cep = cleanCep(value);

  if (!cep.length) {
    return undefined;
  }

  if (!isValidCep(cep)) {
    return "Informe um CEP completo.";
  }

  return undefined;
}

function isDeleting(event: ChangeEvent<HTMLInputElement>) {
  const inputType = (event.nativeEvent as InputEvent).inputType;

  return typeof inputType === "string" && inputType.startsWith("delete");
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
    const [eagerFormatting, setEagerFormatting] = useState(true);
    const [internalError, setInternalError] = useState<string | undefined>();

    const formattedValue = useMemo(
      () =>
        formatCep(isControlled ? (value?.toString() ?? "") : internalValue, {
          eager: eagerFormatting,
        }),
      [eagerFormatting, internalValue, isControlled, value],
    );

    useEffect(() => {
      if (!isControlled) return;
      setInternalValue(
        formatCep(value?.toString() ?? "", { eager: eagerFormatting }),
      );
    }, [eagerFormatting, isControlled, value]);

    useEffect(() => {
      onCepValidityChange?.(isValidCep(formattedValue));
    }, [formattedValue, onCepValidityChange]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const shouldFormatEagerly = !isDeleting(event);
      const nextFormattedValue = formatCep(event.target.value, {
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
      setInternalError(getCepValidationError(event.target.value));
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
