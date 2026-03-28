import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import type { IconType } from "react-icons";

/**
 * Props do botão:
 * - herda todas as props nativas de um <button>
 * - adiciona suporte a ícone e estados extras
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconType;
  loading?: boolean;
  containerClassName?: string;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      icon: Icon,
      loading,
      className = "",
      containerClassName = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full ${containerClassName}`}>
        <button
          ref={ref}
          disabled={disabled || loading}
          className={`
            flex w-full items-center justify-center gap-2
            rounded-full
            px-4 py-[14px]

            bg-[#C4E6F0]
            shadow-[2px_2px_4px_2px_rgba(0,0,0,0.15)]

            text-black font-medium
            transition-all duration-200

            hover:brightness-95
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed

            ${className}
          `}
          {...props}
        >
          {/* Ícone */}
          {Icon && !loading && <Icon className="text-lg" />}

          {/* Texto */}
          <span>
            {loading ? "Carregando..." : children}
          </span>
        </button>
      </div>
    );
  }
);

Button.displayName = "Button";

export default Button;