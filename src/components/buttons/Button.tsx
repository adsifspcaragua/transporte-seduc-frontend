import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/utils/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "approved"
  | "danger"
  | "light"
  | "success"
  | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  uppercase?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    border-[#084E80] bg-[#084E80] text-white
    hover:border-[#06446F] hover:bg-[#06446F]
    active:border-[#05395F] active:bg-[#05395F]
    disabled:border-[#8DB6D1] disabled:bg-[#8DB6D1] disabled:text-white/75
    shadow-sm
  `,
  secondary: `
    border-[#C4E6F0] bg-[#C4E6F0] text-[#084E80]
    hover:border-[#D6EFF6] hover:bg-[#D6EFF6]
    active:border-[#AFD8E5] active:bg-[#AFD8E5]
    disabled:border-[#E2F2F6] disabled:bg-[#E2F2F6] disabled:text-[#084E80]/45
    shadow-sm
  `,
  neutral: `
    border-[#004685]/20 bg-white text-[#004685]
    hover:bg-[#004685]/5
    active:border-[#004685]/30 active:bg-[#004685]/10
    disabled:border-[#004685]/10 disabled:bg-white disabled:text-[#004685]/35
    shadow-sm
  `,
  approved: `
    border-[#008000] bg-[#008000] text-white
    hover:border-[#007300] hover:bg-[#007300]
    active:border-[#006000] active:bg-[#006000]
    disabled:border-[#86C58A] disabled:bg-[#86C58A] disabled:text-white/75
    shadow-sm
  `,
  danger: `
    border-[#D32F2F] bg-[#D32F2F] text-white
    hover:border-[#C51F1F] hover:bg-[#C51F1F]
    active:border-[#A91515] active:bg-[#A91515]
    disabled:border-[#EAA1A1] disabled:bg-[#EAA1A1] disabled:text-white/75
    shadow-sm
  `,
  light: `
    border-[#C4E6F0] bg-[#C4E6F0] text-[#084E80]
    hover:border-[#D6EFF6] hover:bg-[#D6EFF6]
    active:border-[#AFD8E5] active:bg-[#AFD8E5]
    disabled:border-[#E2F2F6] disabled:bg-[#E2F2F6] disabled:text-[#084E80]/45
    shadow-sm
  `,
  success: `
    border-[#008000] bg-[#008000] text-white
    hover:border-[#007300] hover:bg-[#007300]
    active:border-[#006000] active:bg-[#006000]
    disabled:border-[#86C58A] disabled:bg-[#86C58A] disabled:text-white/75
    shadow-sm
  `,
  ghost: `
    border-[#004685]/20 bg-white text-[#004685]
    hover:bg-[#004685]/5
    active:border-[#004685]/30 active:bg-[#004685]/10
    disabled:border-[#004685]/10 disabled:bg-white disabled:text-[#004685]/35
    shadow-sm
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-2 text-sm",
  md: "min-h-11 px-5 py-2.5 text-base",
  lg: "min-h-12 px-6 py-3 text-lg",
  icon: "size-10 p-0",
};

const spinnerClasses: Record<ButtonVariant, string> = {
  primary: "border-white border-t-transparent",
  secondary: "border-[#084E80] border-t-transparent",
  neutral: "border-[#004685] border-t-transparent",
  approved: "border-white border-t-transparent",
  danger: "border-white border-t-transparent",
  light: "border-[#084E80] border-t-transparent",
  success: "border-white border-t-transparent",
  ghost: "border-[#004685] border-t-transparent",
};

export default function Button({
  children,
  leftIcon,
  rightIcon,
  fullWidth = true,
  loading = false,
  variant = "light",
  size = "md",
  uppercase = true,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const isIconOnly = size === "icon";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#084E80] disabled:cursor-not-allowed",
        uppercase ? "uppercase tracking-wide" : "normal-case tracking-normal",
        fullWidth && !isIconOnly && "w-full",
        !fullWidth && "self-center",
        variantClasses[variant],
        sizeClasses[size],
        !loading && "cursor-pointer active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className={cn(
            "h-5 w-5 animate-spin rounded-full border-2",
            spinnerClasses[variant],
          )}
        />
      ) : (
        <>
          {leftIcon && (
            <span className="flex items-center justify-center [&>svg]:size-5">
              {leftIcon}
            </span>
          )}

          {!isIconOnly && children && <span>{children}</span>}

          {rightIcon && (
            <span className="flex items-center justify-center [&>svg]:size-5">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
