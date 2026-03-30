import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
};

export default function Button(
  {
    children,
    leftIcon,
    rightIcon,
    fullWidth = true,
    loading = false,
    className = "",
    disabled,
    type = "button",
    ...props
  }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-full
        bg-brand-100 px-8 py-3 cursor-pointer font-semibold uppercase tracking-wide
        text-brand-700 shadow-[0_10px_25px_rgba(0,0,0,0.18)]
        transition-all duration-200
        hover:brightness-95
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-60
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" />
      ) : (
        <>
          {leftIcon && <span className="flex items-center justify-center">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex items-center justify-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}