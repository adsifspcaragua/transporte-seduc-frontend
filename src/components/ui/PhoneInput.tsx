"use client";

import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { BiPhone } from "react-icons/bi";

import type { InputProps } from "@/components/ui/Input";
import Input from "@/components/ui/Input";
import { cleanPhone, formatPhone, isValidPhone } from "@/lib/utils/phone";

type PhoneInputProps = Omit<
  InputProps,
  "icon" | "inputMode" | "maxLength" | "onChange" | "type"
> & {
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onPhoneValidityChange?: (isValid: boolean) => void;
};

function getPhoneValidationError(value: string, required?: boolean) {
  const phone = cleanPhone(value);

  if (!phone.length) {
    return required ? "Este campo é obrigatório." : undefined;
  }

  if (phone.length < 11) {
    return "Informe um telefone completo.";
  }

  if (!isValidPhone(phone)) {
    return "Informe um telefone válido.";
  }

  return undefined;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onBlur,
      error,
      label = "Telefone",
      required,
      onPhoneValidityChange,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(() =>
      formatPhone(defaultValue?.toString() ?? ""),
    );
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();

    const formattedValue = useMemo(
      () =>
        formatPhone(isControlled ? (value?.toString() ?? "") : internalValue),
      [internalValue, isControlled, value],
    );

    useEffect(() => {
      if (!isControlled) return;
      setInternalValue(formatPhone(value?.toString() ?? ""));
    }, [isControlled, value]);

    useEffect(() => {
      onPhoneValidityChange?.(isValidPhone(formattedValue));
    }, [formattedValue, onPhoneValidityChange]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const nextFormattedValue = formatPhone(event.target.value);

      event.target.value = nextFormattedValue;

      if (!isControlled) {
        setInternalValue(nextFormattedValue);
      }

      if (touched) {
        setInternalError(getPhoneValidationError(nextFormattedValue, required));
      }

      onChange?.(event);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      setTouched(true);
      setInternalError(getPhoneValidationError(event.target.value, required));
      onBlur?.(event);
    }

    return (
      <Input
        ref={ref}
        type="text"
        label={label}
        required={required}
        inputMode="tel"
        autoComplete="tel-national"
        icon={BiPhone}
        maxLength={15}
        value={formattedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error ?? internalError}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;
