"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
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

import type { InputVariant } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

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
    hint: string;
    icon: string;
    placeholder: string;
  }
> = {
  dark: {
    field: "rounded-full border-2 bg-brand-700 text-white",
    state: "border-brand-700 focus:border-brand-100",
    label: "text-white/70",
    hint: "text-white/60",
    icon: "text-white/70",
    placeholder: "text-white/70",
  },
  white: {
    field: "rounded-lg border bg-white text-slate-900",
    state:
      "border-slate-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600",
    label: "text-brand-600",
    hint: "text-slate-500",
    icon: "text-brand-600",
    placeholder: "text-slate-500",
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
      placeholder = "Selecione",
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

    const allOptions = useMemo<SelectOption[]>(
      () => [
        {
          disabled: true,
          label: placeholder,
          value: "",
        },
        ...parsedOptions,
      ],
      [parsedOptions, placeholder],
    );

    const selectedOption = allOptions.find(
      (option) => option.value === selectedValue,
    );
    const hasSelectedValue = Boolean(selectedValue && selectedOption);
    const displayLabel = selectedOption?.label ?? placeholder;

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
              "peer flex w-full items-center justify-between gap-4 px-8 pb-1 pt-6 text-left outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
              variantClasses[variant].field,
              error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : variantClasses[variant].state,
              "pr-16",
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
                "pointer-events-none absolute left-8 top-2 flex items-center gap-1.5 text-xs uppercase transition-all duration-200 [&>svg]:size-4",
                variantClasses[variant].label,
                labelClassName,
              )}
            >
              {Icon && <Icon className="mb-0.5" />}
              {label}
              {required && <span className="ml-1 text-red-400">*</span>}
            </label>
          )}

          <div
            className={cn(
              "pointer-events-none absolute right-6 top-1/2 z-10 -translate-y-1/2 transition-transform duration-200",
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
                "absolute left-0 top-full z-[60] mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm text-slate-900 shadow-xl shadow-slate-900/10",
                listboxClassName,
              )}
            >
              {allOptions.map((option, index) => {
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
                      "flex min-h-10 w-full items-center px-4 py-2.5 text-left font-medium transition-colors",
                      isSelected && "bg-brand-600 text-white",
                      !isSelected &&
                        isActive &&
                        "bg-brand-100/60 text-brand-700",
                      !isSelected &&
                        !isActive &&
                        "text-slate-700 hover:bg-brand-100/60 hover:text-brand-700",
                      option.disabled &&
                        "cursor-not-allowed bg-transparent text-slate-400 hover:bg-transparent hover:text-slate-400",
                      optionClassName,
                    )}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error ? (
          <span className={cn("text-sm text-red-400", errorClassName)}>
            {error}
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
