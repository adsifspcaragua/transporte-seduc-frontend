import type { ReactNode } from "react";

import { FrequenciaLayout } from "@/components/ui/frequencias/FrequenciaLayout";

export default function FrequenciasLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <FrequenciaLayout>{children}</FrequenciaLayout>;
}
