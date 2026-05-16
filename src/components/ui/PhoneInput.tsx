"use client";

import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { forwardRef, useEffect, useMemo, useState } from "react";

import type { InputProps } from "@/components/ui/Input";
import Input from "@/components/ui/Input";
import { cleanPhone, formatPhone, isValidPhone } from "@/lib/utils/phone";

type PhoneInputProps = Omit<
  InputProps,
  "inputMode" | "maxLength" | "onChange" | "type"
> & {
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onPhoneValidityChange?: (isValid: boolean) => void;
};

function getPhoneValidationError(value: string) {
  const phone = cleanPhone(value);

  if (!phone.length) {
    return undefined;
  }

  if (phone.length < 11) {
    return "Informe um telefone completo.";
  }

  if (!isValidPhone(phone)) {
    return "Informe um telefone válido.";
  }

  return undefined;
}

function isDeleting(event: ChangeEvent<HTMLInputElement>) {
  const inputType = (event.nativeEvent as InputEvent).inputType;

  return typeof inputType === "string" && inputType.startsWith("delete");
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
    const [eagerFormatting, setEagerFormatting] = useState(true);
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();

    const formattedValue = useMemo(
      () =>
        formatPhone(isControlled ? (value?.toString() ?? "") : internalValue, {
          eager: eagerFormatting,
        }),
      [eagerFormatting, internalValue, isControlled, value],
    );

    useEffect(() => {
      if (!isControlled) return;
      setInternalValue(
        formatPhone(value?.toString() ?? "", { eager: eagerFormatting }),
      );
    }, [eagerFormatting, isControlled, value]);

    useEffect(() => {
      onPhoneValidityChange?.(isValidPhone(formattedValue));
    }, [formattedValue, onPhoneValidityChange]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      const shouldFormatEagerly = !isDeleting(event);
      const nextFormattedValue = formatPhone(event.target.value, {
        eager: shouldFormatEagerly,
      });

      setEagerFormatting(shouldFormatEagerly);
      event.target.value = nextFormattedValue;

      if (!isControlled) {
        setInternalValue(nextFormattedValue);
      }

      if (touched) {
        setInternalError(getPhoneValidationError(nextFormattedValue));
      }

      onChange?.(event);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      setTouched(true);
      setInternalError(getPhoneValidationError(event.target.value));
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
