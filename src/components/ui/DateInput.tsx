"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  ChangeEvent,
  ChangeEventHandler,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

import type { InputProps } from "@/components/ui/Input";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

type CalendarView = "days" | "months" | "years";

type DateInputProps = Omit<
  InputProps,
  "defaultValue" | "icon" | "onChange" | "type" | "value"
> & {
  defaultValue?: string;
  maxYear?: number;
  minYear?: number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  value?: string;
};

type CalendarDay = {
  date: Date;
  key: string;
  isCurrentMonth: boolean;
};

const YEARS_PER_PAGE = 12;
const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long" });

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getMonthName(monthIndex: number) {
  return capitalize(monthFormatter.format(new Date(2024, monthIndex, 1)));
}

function parseIsoDate(value?: string) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseDisplayDate(value?: string) {
  if (!value) return null;

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function parseDateValue(value?: string) {
  return parseIsoDate(value) ?? parseDisplayDate(value);
}

function formatIsoDate(date: Date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function formatDisplayDate(date: Date | null) {
  if (!date) return "";

  return [
    padDatePart(date.getDate()),
    padDatePart(date.getMonth() + 1),
    date.getFullYear(),
  ].join("/");
}

function formatDateValue(value?: string) {
  return formatDisplayDate(parseDateValue(value));
}

function formatTypedDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function getComparableDate(date: Date) {
  return (
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
  );
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return getComparableDate(firstDate) === getComparableDate(secondDate);
}

function isDateInRange(
  date: Date,
  minDate: Date | null,
  maxDate: Date | null,
  minYear: number,
  maxYear: number,
) {
  const comparableDate = getComparableDate(date);
  const year = date.getFullYear();

  if (year < minYear || year > maxYear) return false;
  if (minDate && comparableDate < getComparableDate(minDate)) return false;
  if (maxDate && comparableDate > getComparableDate(maxDate)) return false;

  return true;
}

function doesRangeOverlap(
  startDate: Date,
  endDate: Date,
  minDate: Date | null,
  maxDate: Date | null,
) {
  if (minDate && getComparableDate(endDate) < getComparableDate(minDate)) {
    return false;
  }

  if (maxDate && getComparableDate(startDate) > getComparableDate(maxDate)) {
    return false;
  }

  return true;
}

function isMonthInRange(
  year: number,
  month: number,
  minDate: Date | null,
  maxDate: Date | null,
  minYear: number,
  maxYear: number,
) {
  if (year < minYear || year > maxYear) return false;

  return doesRangeOverlap(
    new Date(year, month, 1),
    new Date(year, month + 1, 0),
    minDate,
    maxDate,
  );
}

function isYearInRange(
  year: number,
  minDate: Date | null,
  maxDate: Date | null,
  minYear: number,
  maxYear: number,
) {
  if (year < minYear || year > maxYear) return false;

  return doesRangeOverlap(
    new Date(year, 0, 1),
    new Date(year, 11, 31),
    minDate,
    maxDate,
  );
}

function getCalendarDays(viewDate: Date): CalendarDay[] {
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1,
  );
  const firstGridDay = new Date(firstDayOfMonth);
  firstGridDay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  return Array.from({ length: 42 }, (_, dayOffset) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + dayOffset);

    return {
      date,
      key: formatIsoDate(date),
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
    };
  });
}

function getYearPageStart(year: number) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

function createChangeEvent(
  value: string,
  name?: string,
): ChangeEvent<HTMLInputElement> {
  return {
    target: { name, value },
    currentTarget: { name, value },
  } as ChangeEvent<HTMLInputElement>;
}

function getLocalToday() {
  return new Date();
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label = "Data",
      className = "",
      containerClassName = "",
      value,
      defaultValue,
      onChange,
      onBlur,
      onClick,
      onFocus,
      onKeyDown,
      min,
      max,
      minYear,
      maxYear,
      disabled,
      readOnly,
      name,
      id,
      variant = "dark",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const calendarId = `${inputId}-calendar`;
    const containerRef = useRef<HTMLDivElement>(null);
    const today = useMemo(() => getLocalToday(), []);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : (defaultValue ?? "");
    const selectedDate = parseDateValue(currentValue);
    const minDate = parseIsoDate(typeof min === "string" ? min : undefined);
    const maxDate = parseIsoDate(typeof max === "string" ? max : undefined);
    const effectiveMinYear = minYear ?? minDate?.getFullYear() ?? 1900;
    const effectiveMaxYear =
      maxYear ?? maxDate?.getFullYear() ?? today.getFullYear() + 10;
    const initialViewDate = selectedDate ?? today;

    const [committedValue, setCommittedValue] = useState(defaultValue ?? "");
    const [displayValue, setDisplayValue] = useState(() =>
      formatDateValue(currentValue),
    );
    const [isOpen, setIsOpen] = useState(false);
    const [calendarView, setCalendarView] = useState<CalendarView>("days");
    const [viewDate, setViewDate] = useState(initialViewDate);
    const [yearPageStart, setYearPageStart] = useState(
      getYearPageStart(initialViewDate.getFullYear()),
    );

    const storedValue = isControlled ? value : committedValue;
    const storedDate = parseDateValue(storedValue);
    const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
    const canChooseToday = isDateInRange(
      today,
      minDate,
      maxDate,
      effectiveMinYear,
      effectiveMaxYear,
    );
    const canGoToPreviousMonth = isMonthInRange(
      viewDate.getFullYear(),
      viewDate.getMonth() - 1,
      minDate,
      maxDate,
      effectiveMinYear,
      effectiveMaxYear,
    );
    const canGoToNextMonth = isMonthInRange(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      minDate,
      maxDate,
      effectiveMinYear,
      effectiveMaxYear,
    );
    const canGoToPreviousYear = isYearInRange(
      viewDate.getFullYear() - 1,
      minDate,
      maxDate,
      effectiveMinYear,
      effectiveMaxYear,
    );
    const canGoToNextYear = isYearInRange(
      viewDate.getFullYear() + 1,
      minDate,
      maxDate,
      effectiveMinYear,
      effectiveMaxYear,
    );
    const canGoToPreviousYearPage = yearPageStart > effectiveMinYear;
    const canGoToNextYearPage =
      yearPageStart + YEARS_PER_PAGE - 1 < effectiveMaxYear;

    useEffect(() => {
      setDisplayValue(formatDateValue(storedValue));
    }, [storedValue]);

    useEffect(() => {
      if (!isOpen) {
        const nextStoredDate = parseDateValue(storedValue);

        if (nextStoredDate) {
          setViewDate(nextStoredDate);
          setYearPageStart(getYearPageStart(nextStoredDate.getFullYear()));
        }
      }
    }, [isOpen, storedValue]);

    useEffect(() => {
      if (!isOpen) return;

      function handlePointerDown(event: PointerEvent) {
        if (!containerRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
          setCalendarView("days");
        }
      }

      document.addEventListener("pointerdown", handlePointerDown);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
      };
    }, [isOpen]);

    function openCalendar() {
      if (disabled || readOnly) return;

      setIsOpen((wasOpen) => {
        if (!wasOpen) {
          const nextViewDate = storedDate ?? today;

          setViewDate(nextViewDate);
          setYearPageStart(getYearPageStart(nextViewDate.getFullYear()));
          setCalendarView("days");
        }

        return true;
      });
    }

    function emitChange(nextValue: string) {
      if (!isControlled) {
        setCommittedValue(nextValue);
      }

      onChange?.(createChangeEvent(nextValue, name));
    }

    function commitDate(date: Date) {
      if (
        !isDateInRange(
          date,
          minDate,
          maxDate,
          effectiveMinYear,
          effectiveMaxYear,
        )
      ) {
        return;
      }

      const nextValue = formatIsoDate(date);

      setDisplayValue(formatDisplayDate(date));
      setViewDate(date);
      emitChange(nextValue);
    }

    function handleDateSelect(date: Date) {
      commitDate(date);
      setIsOpen(false);
      setCalendarView("days");
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
      const nextDisplayValue = formatTypedDate(event.target.value);
      const nextDate = parseDisplayDate(nextDisplayValue);

      setDisplayValue(nextDisplayValue);

      if (!nextDisplayValue) {
        emitChange("");
        return;
      }

      if (nextDisplayValue.length === 10 && nextDate) {
        commitDate(nextDate);
      }
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      onBlur?.(event);

      if (!displayValue) return;

      const typedDate = parseDisplayDate(displayValue);

      if (
        typedDate &&
        isDateInRange(
          typedDate,
          minDate,
          maxDate,
          effectiveMinYear,
          effectiveMaxYear,
        )
      ) {
        return;
      }

      setDisplayValue(formatDateValue(storedValue));
    }

    function handleClick(event: MouseEvent<HTMLInputElement>) {
      onClick?.(event);

      if (!event.defaultPrevented) {
        openCalendar();
      }
    }

    function handleFocus(event: FocusEvent<HTMLInputElement>) {
      onFocus?.(event);

      if (!event.defaultPrevented) {
        openCalendar();
      }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);

      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        setIsOpen(false);
        setCalendarView("days");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        openCalendar();
      }
    }

    function changeMonth(monthOffset: number) {
      setViewDate(
        (currentViewDate) =>
          new Date(
            currentViewDate.getFullYear(),
            currentViewDate.getMonth() + monthOffset,
            1,
          ),
      );
    }

    function changeYear(yearOffset: number) {
      setViewDate(
        (currentViewDate) =>
          new Date(
            currentViewDate.getFullYear() + yearOffset,
            currentViewDate.getMonth(),
            1,
          ),
      );
    }

    function handleMonthSelect(monthIndex: number) {
      if (
        !isMonthInRange(
          viewDate.getFullYear(),
          monthIndex,
          minDate,
          maxDate,
          effectiveMinYear,
          effectiveMaxYear,
        )
      ) {
        return;
      }

      setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
      setCalendarView("days");
    }

    function handleYearSelect(year: number) {
      if (
        !isYearInRange(
          year,
          minDate,
          maxDate,
          effectiveMinYear,
          effectiveMaxYear,
        )
      ) {
        return;
      }

      setViewDate(new Date(year, viewDate.getMonth(), 1));
      setCalendarView("months");
    }

    function handleTodaySelect() {
      if (!canChooseToday) return;

      handleDateSelect(today);
    }

    function handleClear() {
      setDisplayValue("");
      emitChange("");
      setIsOpen(false);
      setCalendarView("days");
    }

    function renderCalendarHeader() {
      if (calendarView === "years") {
        return (
          <>
            <button
              type="button"
              aria-label="Anos anteriores"
              disabled={!canGoToPreviousYearPage}
              onClick={() =>
                setYearPageStart(
                  (currentYearPageStart) =>
                    currentYearPageStart - YEARS_PER_PAGE,
                )
              }
              className="flex size-9 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-brand-100/55 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-6" />
            </button>

            <div className="text-center text-sm font-semibold text-brand-700">
              {yearPageStart} - {yearPageStart + YEARS_PER_PAGE - 1}
            </div>

            <button
              type="button"
              aria-label="Proximos anos"
              disabled={!canGoToNextYearPage}
              onClick={() =>
                setYearPageStart(
                  (currentYearPageStart) =>
                    currentYearPageStart + YEARS_PER_PAGE,
                )
              }
              className="flex size-9 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-brand-100/55 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        );
      }

      if (calendarView === "months") {
        return (
          <>
            <button
              type="button"
              aria-label="Ano anterior"
              disabled={!canGoToPreviousYear}
              onClick={() => changeYear(-1)}
              className="flex size-9 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-brand-100/55 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="size-6" />
            </button>

            <button
              type="button"
              onClick={() => {
                setYearPageStart(getYearPageStart(viewDate.getFullYear()));
                setCalendarView("years");
              }}
              className="rounded-full px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100/55"
            >
              {viewDate.getFullYear()}
            </button>

            <button
              type="button"
              aria-label="Proximo ano"
              disabled={!canGoToNextYear}
              onClick={() => changeYear(1)}
              className="flex size-9 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-brand-100/55 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        );
      }

      return (
        <>
          <button
            type="button"
            aria-label="Mes anterior"
            disabled={!canGoToPreviousMonth}
            onClick={() => changeMonth(-1)}
            className="flex size-9 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-brand-100/55 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-6" />
          </button>

          <button
            type="button"
            onClick={() => setCalendarView("months")}
            className="rounded-full px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100/55"
          >
            {getMonthName(viewDate.getMonth())} {viewDate.getFullYear()}
          </button>

          <button
            type="button"
            aria-label="Proximo mes"
            disabled={!canGoToNextMonth}
            onClick={() => changeMonth(1)}
            className="flex size-9 items-center justify-center rounded-full text-brand-600 transition-colors hover:bg-brand-100/55 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      );
    }

    function renderDaysView() {
      return (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-[0.69rem] font-semibold uppercase text-brand-600/65">
            {WEEKDAY_NAMES.map((weekdayName) => (
              <span key={weekdayName} className="py-1">
                {weekdayName}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((calendarDay) => {
              const isSelected =
                storedDate && isSameDay(calendarDay.date, storedDate);
              const isToday = isSameDay(calendarDay.date, today);
              const isDisabled = !isDateInRange(
                calendarDay.date,
                minDate,
                maxDate,
                effectiveMinYear,
                effectiveMaxYear,
              );

              return (
                <button
                  key={calendarDay.key}
                  type="button"
                  disabled={isDisabled}
                  aria-pressed={Boolean(isSelected)}
                  aria-label={calendarDay.date.toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  onClick={() => handleDateSelect(calendarDay.date)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-full text-sm font-medium transition-colors",
                    calendarDay.isCurrentMonth
                      ? "text-brand-700"
                      : "text-brand-600/35",
                    isToday && "ring-1 ring-brand-100",
                    isSelected &&
                      "bg-brand-600 text-white shadow-md shadow-brand-700/20 ring-0 hover:bg-brand-700",
                    !isSelected && !isDisabled && "hover:bg-brand-100/55",
                    isDisabled &&
                      "cursor-not-allowed text-slate-300 opacity-60",
                  )}
                >
                  {calendarDay.date.getDate()}
                </button>
              );
            })}
          </div>
        </>
      );
    }

    function renderMonthsView() {
      return (
        <div className="grid grid-cols-3 gap-2">
          {MONTH_INDEXES.map((monthIndex) => {
            const isSelected =
              storedDate &&
              storedDate.getFullYear() === viewDate.getFullYear() &&
              storedDate.getMonth() === monthIndex;
            const isDisabled = !isMonthInRange(
              viewDate.getFullYear(),
              monthIndex,
              minDate,
              maxDate,
              effectiveMinYear,
              effectiveMaxYear,
            );

            return (
              <button
                key={monthIndex}
                type="button"
                disabled={isDisabled}
                onClick={() => handleMonthSelect(monthIndex)}
                className={cn(
                  "min-h-11 rounded-xl px-2 text-sm font-semibold text-brand-700 transition-colors",
                  isSelected &&
                    "bg-brand-600 text-white shadow-md shadow-brand-700/20 hover:bg-brand-700",
                  !isSelected && !isDisabled && "hover:bg-brand-100/55",
                  isDisabled && "cursor-not-allowed text-slate-300",
                )}
              >
                {getMonthName(monthIndex)}
              </button>
            );
          })}
        </div>
      );
    }

    function renderYearsView() {
      return (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: YEARS_PER_PAGE }, (_, yearOffset) => {
            const year = yearPageStart + yearOffset;
            const isSelected = storedDate?.getFullYear() === year;
            const isDisabled = !isYearInRange(
              year,
              minDate,
              maxDate,
              effectiveMinYear,
              effectiveMaxYear,
            );

            return (
              <button
                key={year}
                type="button"
                disabled={isDisabled}
                onClick={() => handleYearSelect(year)}
                className={cn(
                  "min-h-11 rounded-xl px-2 text-sm font-semibold text-brand-700 transition-colors",
                  isSelected &&
                    "bg-brand-600 text-white shadow-md shadow-brand-700/20 hover:bg-brand-700",
                  !isSelected && !isDisabled && "hover:bg-brand-100/55",
                  isDisabled && "cursor-not-allowed text-slate-300",
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn("relative w-full", containerClassName)}
      >
        <Input
          ref={ref}
          id={inputId}
          type="text"
          label={label}
          value={displayValue}
          name={undefined}
          variant={variant}
          disabled={disabled}
          readOnly={readOnly}
          inputMode="numeric"
          maxLength={10}
          autoComplete="bday"
          className={cn("cursor-text", className)}
          containerClassName=""
          onBlur={handleBlur}
          onChange={handleInputChange}
          onClick={handleClick}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          aria-controls={calendarId}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          {...props}
        />

        {name && <input type="hidden" name={name} value={storedValue} />}

        {isOpen && (
          <div
            id={calendarId}
            role="dialog"
            aria-label="Selecionar data"
            onMouseDown={(event) => event.preventDefault()}
            className="absolute left-0 top-full z-50 mt-2 w-full min-w-72 max-w-sm rounded-2xl border border-brand-100 bg-white p-4 text-brand-700 shadow-xl shadow-brand-700/15"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              {renderCalendarHeader()}
            </div>

            {calendarView === "days" && renderDaysView()}
            {calendarView === "months" && renderMonthsView()}
            {calendarView === "years" && renderYearsView()}

            <div className="mt-4 flex items-center justify-between border-t border-brand-100/70 pt-3">
              <button
                type="button"
                onClick={handleClear}
                disabled={!storedValue && !displayValue}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-100/55 disabled:cursor-not-allowed disabled:text-brand-600/35"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={handleTodaySelect}
                disabled={!canChooseToday}
                className="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Hoje
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

DateInput.displayName = "DateInput";

export default DateInput;
