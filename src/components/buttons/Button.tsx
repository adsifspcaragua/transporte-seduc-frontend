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
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    border-edit-default bg-edit-default text-white
    hover:border-edit-hover hover:bg-edit-hover
    active:border-edit-pressing active:bg-edit-pressing
    disabled:border-edit-disabled disabled:bg-edit-disabled disabled:text-white/75
    shadow-sm
  `,
  secondary: `
    gap-3 border-brand-600/20 bg-white text-brand-600
    hover:bg-brand-600/5
    active:border-brand-600/30 active:bg-brand-600/10
    disabled:border-brand-600/10 disabled:bg-white disabled:text-brand-600/35
    shadow-sm
  `,
  neutral: `
    border-brand-600/20 bg-white text-brand-600
    hover:bg-brand-600/5
    active:border-brand-600/30 active:bg-brand-600/10
    disabled:border-brand-600/10 disabled:bg-white disabled:text-brand-600/35
    shadow-sm
  `,
  approved: `
    border-approve-default bg-approve-default text-white
    hover:border-approve-hover hover:bg-approve-hover
    active:border-approve-pressing active:bg-approve-pressing
    disabled:border-approve-disabled disabled:bg-approve-disabled disabled:text-white/75
    shadow-sm
  `,
  danger: `
    border-danger-600 bg-danger-600 text-white
    hover:border-danger-700 hover:bg-danger-700
    active:border-danger-800 active:bg-danger-800
    disabled:border-delete-disabled disabled:bg-delete-disabled disabled:text-white/75
    shadow-sm
  `,
  light: `
    border-action-light-default bg-action-light-default text-brand-600
    hover:border-action-light-hover hover:bg-action-light-hover
    active:border-action-light-pressing active:bg-action-light-pressing
    disabled:border-action-light-disabled disabled:bg-action-light-disabled disabled:text-brand-600/45
    shadow-sm
  `,
  success: `
    border-approve-default bg-approve-default text-white
    hover:border-approve-hover hover:bg-approve-hover
    active:border-approve-pressing active:bg-approve-pressing
    disabled:border-approve-disabled disabled:bg-approve-disabled disabled:text-white/75
    shadow-sm
  `,
  ghost: `
    border-brand-600/20 bg-white text-brand-600
    hover:bg-brand-600/5
    active:border-brand-600/30 active:bg-brand-600/10
    disabled:border-brand-600/10 disabled:bg-white disabled:text-brand-600/35
    shadow-sm
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-11 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-11 px-6 text-lg",
  icon: "size-11 p-0",
};

const spinnerClasses: Record<ButtonVariant, string> = {
  primary: "border-white border-t-transparent",
  secondary: "border-brand-600 border-t-transparent",
  neutral: "border-brand-600 border-t-transparent",
  approved: "border-white border-t-transparent",
  danger: "border-white border-t-transparent",
  light: "border-brand-600 border-t-transparent",
  success: "border-white border-t-transparent",
  ghost: "border-brand-600 border-t-transparent",
};

export default function Button({
  children,
  leftIcon,
  rightIcon,
  fullWidth = true,
  loading = false,
  variant = "light",
  size = "md",
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
        "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed",
        "normal-case tracking-normal",
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
