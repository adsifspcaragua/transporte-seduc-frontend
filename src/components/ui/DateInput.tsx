"use client";

import { forwardRef } from "react";
import { BiCalendar } from "react-icons/bi";

import type { InputProps } from "@/components/ui/Input";
import Input from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

type DateInputProps = Omit<InputProps, "icon" | "type">;

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label = "Data", className = "", labelClassName = "", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        label={label}
        icon={BiCalendar}
        className={cn(
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70",
          className,
        )}
        labelClassName={cn(
          "top-2 translate-y-0 text-xs peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-xs",
          labelClassName,
        )}
        {...props}
      />
    );
  },
);

DateInput.displayName = "DateInput";

export default DateInput;
