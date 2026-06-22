import type { ReactNode } from "react";

import { Button } from "@/components/buttons";

type TableActionButtonVariant =
  | "approved"
  | "danger"
  | "ghost"
  | "light"
  | "neutral"
  | "primary"
  | "secondary"
  | "success";

export type TableActionButtonProps = {
  ariaLabel: string;
  icon: ReactNode;
  loading?: boolean;
  onClick?: () => void;
  tooltip: string;
  variant: TableActionButtonVariant;
};

export default function TableActionButton({
  ariaLabel,
  icon,
  loading = false,
  onClick,
  tooltip,
  variant,
}: TableActionButtonProps) {
  return (
    <span className="inline-flex">
      <Button
        aria-label={ariaLabel}
        className="size-8 rounded-md p-0 [&>span>svg]:size-4"
        fullWidth={false}
        leftIcon={icon}
        loading={loading}
        onClick={onClick}
        size="icon"
        title={tooltip}
        variant={variant}
      />
    </span>
  );
}
