"use client";

import { useState } from "react";
import { Button } from "@/components/buttons";
import { Modal } from "@/components/modal";
import {
  type LinhaFormErrors,
  LinhaFormFields,
  type LinhaFormValues,
} from "@/components/ui/linhas/LinhaFormFields";
import {
  buildLinhaPayload,
  horaParaInput,
  validateLinhaForm,
} from "@/components/ui/linhas/linhaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { linhaService } from "@/services/api/modules/linha";
import type { Linha } from "@/types/inscricao";
import { transporteError } from "./transportePresentation";

export function LinhaDadosBasicos({
  linha,
  onSaved,
}: {
  linha: Linha;
  onSaved: () => void;
}) {
  const { can } = useAuthz();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LinhaFormValues>({
    name: linha.name,
    description: linha.description ?? "",
    departure_time: horaParaInput(linha.departure_time),
    return_time: horaParaInput(linha.return_time),
    max_capacity: String(linha.max_capacity ?? ""),
  });
  const [errors, setErrors] = useState<LinhaFormErrors>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  async function save() {
    const nextErrors = validateLinhaForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    setError("");
    try {
      await linhaService.update(linha.id, buildLinhaPayload(values));
      onSaved();
      setSaved(true);
      setOpen(false);
    } catch (failure) {
      setError(transporteError(failure).message);
    } finally {
      setBusy(false);
    }
  }
  if (!can("linhas.write")) return null;
  return (
    <>
      {saved && (
        <output className="text-sm text-emerald-700">
          Dados básicos salvos.
        </output>
      )}
      <Button
        size="sm"
        variant="secondary"
        fullWidth={false}
        onClick={() => {
          setSaved(false);
          setOpen(true);
        }}
      >
        Editar dados básicos
      </Button>
      <Modal
        open={open}
        title="Editar dados da linha"
        onClose={() => !busy && setOpen(false)}
        onSave={() => void save()}
        saveLabel="Salvar alterações"
        saveLoading={busy}
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="text-danger-600">
              {error}
            </p>
          )}
          <LinhaFormFields
            values={values}
            errors={errors}
            onChange={(field, value) => {
              setValues((current) => ({ ...current, [field]: value }));
              setErrors((current) => ({ ...current, [field]: undefined }));
            }}
          />
        </div>
      </Modal>
    </>
  );
}
