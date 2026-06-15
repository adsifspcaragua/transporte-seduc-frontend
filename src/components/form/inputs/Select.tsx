"use client";

import { Check, ChevronDown, CircleX, type LucideIcon } from "lucide-react";
import {
  type ChangeEvent,
  Children,
  forwardRef,
  isValidElement,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/utils/cn";
import type { InputVariant } from "./Input";

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  containerClassName?: string;
  errorClassName?: string;
  labelClassName?: string;
  hintClassName?: string;
  listboxClassName?: string;
  optionClassName?: string;
  rightElementClassName?: string;
  variant?: InputVariant;
  options?: SelectOption[];
  placeholder?: string;
  rightElement?: ReactNode;
};

const variantClasses: Record<
  InputVariant,
  {
    field: string;
    state: string;
    label: string;
    labelFloating: string;
    labelResting: string;
    hint: string;
    error: string;
    icon: string;
    placeholder: string;
  }
> = {
  dark: {
    field: "rounded-lg border-2 bg-transparent text-content-inverse",
    state: "border-border-default focus:border-brand-600",
    label: "text-content-inverse/70",
    labelFloating: "bg-brand-600 text-xs",
    labelResting: "text-sm",
    hint: "text-content-inverse/60",
    error: "font-semibold text-danger-600",
    icon: "text-content-inverse/70",
    placeholder: "text-content-inverse/70",
  },
  white: {
    field: "rounded-lg border-2 bg-surface-primary text-content-primary",
    state: "border-border-default focus:border-brand-600",
    label: "text-content-muted",
    labelFloating: "bg-surface-primary text-xs text-brand-600",
    labelResting: "text-sm",
    hint: "text-content-muted",
    error: "font-medium text-danger-700",
    icon: "text-brand-600",
    placeholder: "text-content-muted",
  },
};

function normalizeValue(
  value: SelectHTMLAttributes<HTMLSelectElement>["value"],
) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return value === undefined || value === null ? "" : String(value);
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  return "";
}

function getOptionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== "option") {
      return [];
    }

    const props = child.props as {
      children?: ReactNode;
      disabled?: boolean;
      value?: string | number;
    };

    return {
      disabled: props.disabled,
      label: getTextContent(props.children),
      value: String(props.value ?? ""),
    };
  });
}

function getNextEnabledIndex(
  options: SelectOption[],
  startIndex: number,
  direction: 1 | -1,
) {
  if (!options.length) {
    return -1;
  }

  let nextIndex = startIndex;

  for (let count = 0; count < options.length; count += 1) {
    nextIndex = (nextIndex + direction + options.length) % options.length;

    if (!options[nextIndex]?.disabled) {
      return nextIndex;
    }
  }

  return -1;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      icon: Icon,
      containerClassName = "",
      errorClassName = "",
      labelClassName = "",
      hintClassName = "",
      listboxClassName = "",
      optionClassName = "",
      rightElementClassName = "",
      className = "",
      variant = "white",
      id,
      required,
      options,
      placeholder = "",
      children,
      rightElement,
      value,
      defaultValue,
      disabled,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const listboxId = `${selectId}-listbox`;
    const rootRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [internalValue, setInternalValue] = useState(() =>
      normalizeValue(defaultValue),
    );
    const isControlled = value !== undefined;
    const selectedValue = isControlled ? normalizeValue(value) : internalValue;

    const parsedOptions = useMemo(
      () =>
        options && options.length > 0
          ? options
          : getOptionsFromChildren(children),
      [children, options],
    );

    const allOptions = parsedOptions;

    const selectedOption = parsedOptions.find(
      (option) => option.value === selectedValue,
    );
    const hasSelectedValue = Boolean(selectedValue && selectedOption);
    const displayLabel = selectedOption?.label ?? "";
    const shouldFloatLabel = isOpen || hasSelectedValue;

    function setSelectRef(node: HTMLSelectElement | null) {
      selectRef.current = node;

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      if (ref) {
        (ref as MutableRefObject<HTMLSelectElement | null>).current = node;
      }
    }

    function emitChange(nextValue: string) {
      const selectElement = selectRef.current;

      if (!selectElement) {
        return;
      }

      selectElement.value = nextValue;
      onChange?.({
        currentTarget: selectElement,
        target: selectElement,
      } as ChangeEvent<HTMLSelectElement>);
    }

    function chooseOption(option: SelectOption) {
      if (disabled || option.disabled) {
        return;
      }

      if (!isControlled) {
        setInternalValue(option.value);
      }

      emitChange(option.value);
      setIsOpen(false);
    }

    function openListbox() {
      if (disabled) {
        return;
      }

      setIsOpen(true);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();

        if (!isOpen) {
          openListbox();
          return;
        }

        setActiveIndex((current) =>
          getNextEnabledIndex(
            allOptions,
            current,
            event.key === "ArrowDown" ? 1 : -1,
          ),
        );
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();

        if (!isOpen) {
          openListbox();
          return;
        }

        const activeOption = allOptions[activeIndex];

        if (activeOption) {
          chooseOption(activeOption);
        }
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const selectedIndex = allOptions.findIndex(
        (option) => option.value === selectedValue && !option.disabled,
      );

      setActiveIndex(
        selectedIndex >= 0
          ? selectedIndex
          : getNextEnabledIndex(allOptions, -1, 1),
      );

      function handlePointerDown(event: PointerEvent) {
        if (!rootRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      document.addEventListener("pointerdown", handlePointerDown);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    }, [allOptions, isOpen, selectedValue]);

    return (
      <div
        ref={rootRef}
        className={cn(
          "relative flex w-full flex-col gap-2",
          containerClassName,
        )}
      >
        <div className="relative w-full">
          <select
            ref={setSelectRef}
            tabIndex={-1}
            aria-hidden="true"
            required={required}
            disabled={disabled}
            value={selectedValue}
            className="sr-only"
            onChange={onChange ?? (() => undefined)}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {parsedOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <button
            id={selectId}
            type="button"
            disabled={disabled}
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-invalid={Boolean(error)}
            onClick={() => setIsOpen((current) => !current && !disabled)}
            onKeyDown={handleKeyDown}
            className={cn(
              "peer flex h-11 w-full cursor-pointer items-center justify-between gap-4 px-4 text-left text-sm font-normal outline-none transition-all duration-200 disabled:cursor-default disabled:border-field-disabled-border disabled:bg-field-disabled-surface disabled:text-field-disabled-content disabled:shadow-inner disabled:shadow-content-disabled/10",
              variantClasses[variant].field,
              error
                ? "border-danger-600 focus:border-danger-600"
                : variantClasses[variant].state,
              "pr-12",
              className,
            )}
          >
            <span
              className={cn(
                "min-w-0 truncate",
                !hasSelectedValue && variantClasses[variant].placeholder,
              )}
            >
              {displayLabel}
            </span>
          </button>

          {label && (
            <label
              htmlFor={selectId}
              className={cn(
                "pointer-events-none absolute left-3 z-10 flex items-center px-1 transition-all duration-200 [&>svg]:size-4",
                shouldFloatLabel
                  ? "top-0 -translate-y-1/2"
                  : "top-1/2 -translate-y-1/2",
                variantClasses[variant].label,
                shouldFloatLabel
                  ? variantClasses[variant].labelFloating
                  : variantClasses[variant].labelResting,
                labelClassName,
              )}
            >
              {Icon && <Icon className="mb-0.5 mr-1.5" />}
              {label}
              {required && <span className="ml-1 text-danger-600">*</span>}
            </label>
          )}

          <div
            className={cn(
              "pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 transition-transform duration-200",
              isOpen && "rotate-180",
              variantClasses[variant].icon,
              rightElementClassName,
            )}
          >
            {rightElement ?? <ChevronDown className="size-5" />}
          </div>

          {isOpen && (
            <div
              id={listboxId}
              role="listbox"
              aria-labelledby={selectId}
              className={cn(
                "select-scrollbar absolute left-0 top-full z-[60] mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-border-subtle bg-surface-primary py-1 text-sm text-content-primary shadow-xl shadow-content-primary/10",
                listboxClassName,
              )}
            >
              {allOptions.length > 0 ? (
                allOptions.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  const isActive = index === activeIndex;

                  return (
                    <button
                      key={`${option.value}-${option.label}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseOption(option)}
                      className={cn(
                        "flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left font-medium transition-colors",
                        isSelected &&
                          "bg-[#e4ebf5] text-brand-600 hover:bg-[#dbe6f2] active:bg-[#d1dfed]",
                        !isSelected &&
                          isActive &&
                          "bg-surface-muted text-brand-700 active:bg-[#e4ebf5]",
                        !isSelected &&
                          !isActive &&
                          "text-content-secondary hover:bg-surface-muted hover:text-brand-700 active:bg-[#e4ebf5]",
                        option.disabled &&
                          "cursor-default bg-transparent text-content-disabled hover:bg-transparent hover:text-content-disabled",
                        optionClassName,
                      )}
                    >
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          isSelected && "font-bold",
                        )}
                      >
                        {option.label}
                      </span>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-brand-600" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex min-h-10 w-full items-center px-4 py-2.5 text-left font-medium text-content-disabled">
                  Nenhuma opção disponível
                </div>
              )}
            </div>
          )}
        </div>

        {error ? (
          <span
            className={cn(
              "flex items-start gap-1.5 text-sm",
              variantClasses[variant].error,
              errorClassName,
            )}
          >
            <CircleX className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </span>
        ) : hint ? (
          <span
            className={cn(
              "text-sm",
              variantClasses[variant].hint,
              hintClassName,
            )}
          >
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
