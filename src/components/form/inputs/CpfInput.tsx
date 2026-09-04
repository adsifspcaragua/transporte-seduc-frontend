"use client";

import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { cleanCpf, formatCpf, isValidCpf } from "@/utils/cpf";
import Input, { type InputProps } from "./Input";

const CPF_FORMAT_GUIDE = [
  { character: "_", id: "digit-1" },
  { character: "_", id: "digit-2" },
  { character: "_", id: "digit-3" },
  { character: ".", id: "dot-1" },
  { character: "_", id: "digit-4" },
  { character: "_", id: "digit-5" },
  { character: "_", id: "digit-6" },
  { character: ".", id: "dot-2" },
  { character: "_", id: "digit-7" },
  { character: "_", id: "digit-8" },
  { character: "_", id: "digit-9" },
  { character: "-", id: "dash" },
  { character: "_", id: "digit-10" },
  { character: "_", id: "digit-11" },
] as const;

type CpfInputProps = Omit<
  InputProps,
  "formatGuide" | "inputMode" | "maxLength" | "onChange" | "type"
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
      onFocus,
      error,
      label = "CPF",
      required,
      onCpfValidityChange,
      className,
      formatGuideClassName,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(() =>
      formatCpf(defaultValue?.toString() ?? ""),
    );
    const [eagerFormatting, setEagerFormatting] = useState(true);
    const [isFocused, setIsFocused] = useState(false);
    const [internalError, setInternalError] = useState<string | undefined>();

    const formattedValue = useMemo(
      () =>
        formatCpf(isControlled ? (value?.toString() ?? "") : internalValue, {
          eager: eagerFormatting,
        }),
      [eagerFormatting, internalValue, isControlled, value],
    );
    const formatGuide = CPF_FORMAT_GUIDE.map(({ character, id }, index) => {
      const isFilled = index < formattedValue.length;
      const isNextPosition = index === formattedValue.length;

      if (character !== "_") {
        return (
          <span key={id} className={isFilled ? "invisible" : undefined}>
            {character}
          </span>
        );
      }

      return (
        <span key={id} className="relative inline-block">
          <span className="invisible">0</span>
          {!isFilled && (
            <span
              className={cn(
                "absolute bottom-0 right-0 h-px bg-current",
                isNextPosition ? "left-0.5" : "left-0",
              )}
            />
          )}
        </span>
      );
    });

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
      setIsFocused(false);
      setInternalError(getCpfValidationError(event.target.value));
      onBlur?.(event);
    }

    function handleFocus(event: FocusEvent<HTMLInputElement>) {
      setIsFocused(true);
      onFocus?.(event);
    }

    return (
      <Input
        ref={ref}
        type="text"
        label={label}
        required={required}
        formatGuide={
          isFocused && formattedValue.length < CPF_FORMAT_GUIDE.length
            ? formatGuide
            : undefined
        }
        formatGuideClassName={cn("tabular-nums", formatGuideClassName)}
        inputMode="numeric"
        autoComplete="off"
        maxLength={14}
        value={formattedValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        error={error ?? internalError}
        className={cn("tabular-nums", className)}
        {...props}
      />
    );
  },
);

CpfInput.displayName = "CpfInput";

export default CpfInput;
