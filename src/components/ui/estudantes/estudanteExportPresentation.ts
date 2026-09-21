export type EstudanteExportFormat = "csv" | "pdf" | "xlsx";

function decodeFilename(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getExportFilename(
  contentDisposition: string | undefined,
  format: EstudanteExportFormat,
) {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition ?? "");
  const regular = /filename="?([^";]+)"?/i.exec(contentDisposition ?? "");
  const filename = decodeFilename(encoded?.[1] ?? regular?.[1] ?? "");

  return filename.split(/[\\/]/).pop() || `estudantes.${format}`;
}
