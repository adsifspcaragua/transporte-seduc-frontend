"use client";

import { Clock3 } from "lucide-react";
import {
  type ChangeEvent,
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/buttons";
import { cn } from "@/utils/cn";
import Input, { type InputProps } from "./Input";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
  const value = String(hour).padStart(2, "0");
  return { label: value, value };
});
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => {
  const value = String(minute).padStart(2, "0");
  return { label: value, value };
});

function TimeColumn({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    const selected = list?.querySelector<HTMLButtonElement>(
      '[aria-selected="true"]',
    );
    if (!list || !selected || selected.dataset.value !== value) return;
    list.scrollTop =
      selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2;
  }, [value]);

  return (
    <div className="min-w-0">
      <p
        id={labelId}
        className="mb-2 text-center text-xs font-semibold text-content-muted"
      >
        {label}
      </p>
      <div
        ref={listRef}
        role="listbox"
        aria-labelledby={labelId}
        className="select-scrollbar relative h-44 overflow-y-auto overscroll-contain rounded-lg border border-border-subtle bg-surface-primary p-1"
      >
        {options.map((option, index) => (
          <Button
            key={option.value}
            role="option"
            aria-selected={option.value === value}
            data-value={option.value}
            tabIndex={option.value === value ? 0 : -1}
            size="sm"
            variant="ghost"
            className={cn(
              "h-9 rounded-md border-0 px-2 text-sm tabular-nums shadow-none",
              option.value === value
                ? "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700"
                : "bg-transparent text-content-secondary hover:bg-surface-muted",
            )}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              let nextIndex = index;
              if (event.key === "ArrowDown")
                nextIndex = (index + 1) % options.length;
              else if (event.key === "ArrowUp")
                nextIndex = (index - 1 + options.length) % options.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = options.length - 1;
              else return;
              event.preventDefault();
              onChange(options[nextIndex].value);
              listRef.current
                ?.querySelectorAll<HTMLButtonElement>('[role="option"]')
                [nextIndex]?.focus({ preventScroll: true });
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export type TimeInputProps = Omit<
  InputProps,
  | "type"
  | "inputMode"
  | "value"
  | "defaultValue"
  | "rightElement"
  | "min"
  | "max"
  | "step"
> & {
  value?: string;
  defaultValue?: string;
};

const TimeInput = forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
      value,
      defaultValue = "",
      onChange,
      onBlur,
      onFocus,
      onClick,
      onKeyDown,
      disabled,
      readOnly,
      error,
      label = "Horário",
      name,
      containerClassName,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [internalError, setInternalError] = useState<string>();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLFieldSetElement>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const panelRef = useRef<HTMLElement>(null);
    const restoringFocusRef = useRef(false);
    const panelId = useId();
    const currentValue = value ?? internalValue;
    const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(currentValue);
    const [hours, minutes] = valid ? currentValue.split(":") : ["00", "00"];

    useLayoutEffect(() => {
      const panel = panelRef.current;
      const input = inputRef.current;
      if (!isOpen || disabled || readOnly || !panel || !input) return;

      panel.showPopover();

      function positionPanel() {
        if (!panel || !input) return;
        const anchor = input.getBoundingClientRect();
        const margin = 8;
        const below = anchor.bottom + margin;
        const top =
          below + panel.offsetHeight <= window.innerHeight - margin
            ? below
            : Math.max(margin, anchor.top - panel.offsetHeight - margin);

        panel.style.top = `${top}px`;
        panel.style.left = `${Math.max(margin, Math.min(anchor.left, window.innerWidth - panel.offsetWidth - margin))}px`;
      }

      positionPanel();
      const resizeObserver = new ResizeObserver(positionPanel);
      resizeObserver.observe(panel);
      window.addEventListener("resize", positionPanel);
      window.addEventListener("scroll", positionPanel, true);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", positionPanel);
        window.removeEventListener("scroll", positionPanel, true);
        if (panel.matches(":popover-open")) panel.hidePopover();
      };
    }, [isOpen, disabled, readOnly]);

    useEffect(() => {
      if (!isOpen) return;
      function handleOutside(event: PointerEvent) {
        if (
          event.target instanceof Node &&
          !containerRef.current?.contains(event.target)
        )
          setIsOpen(false);
      }
      document.addEventListener("pointerdown", handleOutside);
      return () => document.removeEventListener("pointerdown", handleOutside);
    }, [isOpen]);

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

    function closePanel() {
      setIsOpen(false);
      restoringFocusRef.current = true;
      inputRef.current?.focus();
      restoringFocusRef.current = false;
    }

    return (
      <fieldset
        aria-label={label}
        ref={containerRef}
        className={cn("relative min-w-0 w-full", containerClassName)}
        onMouseDownCapture={(event) => {
          if (
            event.button === 0 &&
            event.target instanceof Node &&
            panelRef.current?.contains(event.target)
          ) {
            event.preventDefault();
          }
        }}
        onBlur={(event) => {
          if (
            event.relatedTarget &&
            !event.currentTarget.contains(event.relatedTarget)
          )
            setIsOpen(false);
        }}
        onKeyDown={(event) => {
          if (isOpen && event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            closePanel();
          }
        }}
      >
        <Input
          {...props}
          ref={(element) => {
            inputRef.current = element;
            if (typeof ref === "function") ref(element);
            else if (ref) ref.current = element;
          }}
          name={name}
          label={label}
          type="text"
          inputMode="numeric"
          autoComplete={props.autoComplete ?? "off"}
          maxLength={5}
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          error={error || internalError}
          aria-invalid={Boolean(error || internalError)}
          aria-expanded={isOpen && !disabled && !readOnly}
          aria-controls={panelId}
          onFocus={(event) => {
            onFocus?.(event);
            if (!disabled && !readOnly && !restoringFocusRef.current)
              setIsOpen(true);
          }}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented && !disabled && !readOnly)
              setIsOpen(true);
          }}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
            update(
              digits.length > 2
                ? `${digits.slice(0, 2)}:${digits.slice(2)}`
                : digits,
              event,
            );
          }}
          onBlur={(event) => {
            if (currentValue && !valid)
              setInternalError("Informe um horário válido no formato HH:MM.");
            onBlur?.(event);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (
              !event.defaultPrevented &&
              event.altKey &&
              event.key === "ArrowDown" &&
              !disabled &&
              !readOnly
            ) {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          rightElementClassName="pointer-events-none right-4"
          rightElement={
            <Clock3 aria-hidden="true" className="size-5 text-brand-600" />
          }
        />
        {isOpen && !disabled && !readOnly && (
          <section
            ref={panelRef}
            popover="manual"
            id={panelId}
            aria-label={`Selecionar ${label.toLowerCase()}`}
            className="fixed inset-auto m-0 w-64 max-w-[calc(100vw-1rem)] overflow-visible rounded-2xl border border-brand-100 bg-surface-primary p-4 text-brand-700 shadow-xl shadow-brand-700/15"
          >
            <p className="mb-4 text-sm font-semibold">{label}</p>
            <div className="grid grid-cols-2 items-start gap-3">
              <TimeColumn
                label="Hora"
                options={HOUR_OPTIONS}
                value={hours}
                onChange={(value) => update(`${value}:${minutes}`)}
              />
              <TimeColumn
                label="Minuto"
                options={MINUTE_OPTIONS}
                value={minutes}
                onChange={(value) => update(`${hours}:${value}`)}
              />
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-brand-100 pt-3">
              <Button
                size="sm"
                variant="ghost"
                fullWidth={false}
                onClick={() => update("")}
              >
                Limpar
              </Button>
              <Button
                size="sm"
                variant="primary"
                fullWidth={false}
                onClick={() => {
                  update(`${hours}:${minutes}`);
                  closePanel();
                }}
              >
                Concluir
              </Button>
            </div>
          </section>
        )}
      </fieldset>
    );
  },
);

TimeInput.displayName = "TimeInput";
export default TimeInput;
