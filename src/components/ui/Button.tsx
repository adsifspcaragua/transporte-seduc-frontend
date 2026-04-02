import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "light" | "primary" | "danger" | "ghost";
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
  light: `
    bg-brand-100 text-brand-700
    hover:bg-brand-050
    active:bg-brand-050
    shadow-[0_10px_25px_rgba(0,0,0,0.18)]
  `,
  primary: `
    bg-action-primary text-white
    hover:bg-action-primary-hover
    active:bg-action-primary-pressed
    shadow-[0_10px_25px_rgba(0,0,0,0.18)]
  `,
  danger: `
    bg-danger-600 text-white
    hover:bg-danger-700
    active:bg-danger-800
    shadow-[0_10px_25px_rgba(0,0,0,0.18)]
  `,
  ghost: `
    bg-transparent text-brand-600
    hover:bg-black/5
    active:bg-black/10
    shadow-none
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-12 px-6 py-3 text-base",
  lg: "min-h-14 px-8 py-3.5 text-lg",
  icon: "size-12 p-0",
};

const spinnerClasses: Record<ButtonVariant, string> = {
  light: "border-brand-700 border-t-transparent",
  primary: "border-white border-t-transparent",
  danger: "border-white border-t-transparent",
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
      className={`
        inline-flex items-center justify-center gap-2 rounded-full
        font-semibold transition-all duration-200
        disabled:cursor-not-allowed disabled:opacity-60
        ${uppercase ? "uppercase tracking-wide" : "normal-case tracking-normal"}
        ${fullWidth && !isIconOnly ? "w-full" : ""}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${loading ? "" : "cursor-pointer active:scale-[0.99]"}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span
          className={`h-5 w-5 animate-spin rounded-full border-2 ${spinnerClasses[variant]}`}
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