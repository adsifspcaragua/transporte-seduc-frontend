"use client";

import { Minus, Plus } from "lucide-react";
import {
  type ChangeEvent,
  forwardRef,
  type PointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/buttons";
import { cn } from "@/utils/cn";
import Input, { type InputProps } from "./Input";

export type NumberInputProps = Omit<
  InputProps,
  | "type"
  | "inputMode"
  | "value"
  | "defaultValue"
  | "min"
  | "max"
  | "step"
  | "rightElement"
> & {
  value?: string | number;
  defaultValue?: string | number;
  min?: number;
  max?: number;
  step?: number;
};

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      defaultValue = "",
      min,
      max,
      step = 1,
      onChange,
      onKeyDown,
      onBlur,
      disabled,
      readOnly,
      label,
      name,
      error,
      className,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(String(defaultValue));
    const [internalError, setInternalError] = useState<string>();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const setInputRef = useCallback(
      (element: HTMLInputElement | null) => {
        inputRef.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      },
      [ref],
    );
    const currentValue = String(value ?? internalValue);
    const numericValue =
      currentValue.trim() === "" ? NaN : Number(currentValue);
    const increment = Number.isFinite(step) && step > 0 ? step : 1;
    const inactive = disabled || readOnly;

    function preserveInputFocus(event: PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0 || inactive) return;
      event.preventDefault();
      inputRef.current?.focus({ preventScroll: true });
    }

    function update(nextValue: string, event?: ChangeEvent<HTMLInputElement>) {
      if (value === undefined) setInternalValue(nextValue);
      setInternalError(undefined);
      if (event) {
        event.target.value = nextValue;
        onChange?.(event);
      } else {
        onChange?.({
          target: { name, value: nextValue },
          currentTarget: { name, value: nextValue },
        } as ChangeEvent<HTMLInputElement>);
      }
    }

    function adjust(direction: 1 | -1) {
      if (inactive) return;
      inputRef.current?.focus({ preventScroll: true });
      const nextValue = Number.isFinite(numericValue)
        ? numericValue + direction * increment
        : (min ?? 0);
      update(
        String(
          Number(
            Math.min(
              max ?? Infinity,
              Math.max(min ?? -Infinity, nextValue),
            ).toFixed(10),
          ),
        ),
      );
    }

    return (
      <Input
        {...props}
        ref={setInputRef}
        name={name}
        label={label}
        type="text"
        inputMode={Number.isInteger(increment) ? "numeric" : "decimal"}
        autoComplete={props.autoComplete ?? "off"}
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number.isFinite(numericValue) ? numericValue : undefined}
        aria-invalid={Boolean(error || internalError)}
        value={currentValue}
        disabled={disabled}
        readOnly={readOnly}
        error={error || internalError}
        className={cn("pr-24 tabular-nums", className)}
        rightElementClassName="right-2"
        onChange={(event) => {
          const nextValue = event.target.value.replace(",", ".");
          if (/^-?\d*(\.\d*)?$/.test(nextValue)) update(nextValue, event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || inactive) return;
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            adjust(event.key === "ArrowUp" ? 1 : -1);
          }
        }}
        onBlur={(event) => {
          if (currentValue && !Number.isFinite(numericValue))
            setInternalError("Informe um número válido.");
          else if (min !== undefined && numericValue < min)
            setInternalError(`Informe um valor maior ou igual a ${min}.`);
          else if (max !== undefined && numericValue > max)
            setInternalError(`Informe um valor menor ou igual a ${max}.`);
          onBlur?.(event);
        }}
        rightElement={
          <div className="flex items-center gap-1">
            <Button
              aria-label={`Diminuir ${label ?? "valor"}`}
              className="size-8 rounded-md border-0 bg-transparent shadow-none disabled:border-0 disabled:bg-transparent"
              leftIcon={<Minus className="size-4" />}
              size="icon"
              variant="ghost"
              disabled={inactive || (min !== undefined && numericValue <= min)}
              onClick={() => adjust(-1)}
              onPointerDown={preserveInputFocus}
            />
            <Button
              aria-label={`Aumentar ${label ?? "valor"}`}
              className="size-8 rounded-md border-0 bg-transparent shadow-none disabled:border-0 disabled:bg-transparent"
              leftIcon={<Plus className="size-4" />}
              size="icon"
              variant="ghost"
              disabled={inactive || (max !== undefined && numericValue >= max)}
              onClick={() => adjust(1)}
              onPointerDown={preserveInputFocus}
            />
          </div>
        }
      />
    );
  },
);

NumberInput.displayName = "NumberInput";
export default NumberInput;
