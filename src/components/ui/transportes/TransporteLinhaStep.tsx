"use client";

import axios from "axios";
import { useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Checkbox } from "@/components/form/inputs";
import { Modal } from "@/components/modal";
import {
  type LinhaFormErrors,
  LinhaFormFields,
  type LinhaFormValues,
} from "@/components/ui/linhas/LinhaFormFields";
import {
  buildLinhaPayload,
  validateLinhaForm,
} from "@/components/ui/linhas/linhaPresentation";
import { useAuthz } from "@/hooks/use-authz";
import { linhaService } from "@/services/api/modules/linha";
import {
  getQuerySessionVersion,
  invalidateQueries,
} from "@/services/api/query-cache";
import type { Linha } from "@/types/inscricao";
import type {
  TransporteRead,
  TransporteSaveNotice,
} from "@/types/transporte-operacao";
import { scheduleFocusFirstFieldError } from "@/utils/focus-first-field-error";
import { ReferenceSelect } from "./TransporteReferenceField";
import { shouldReconcileGuidedFailure } from "./transporteOperacaoPresentation";
import { transporteError } from "./transportePresentation";

export function TransporteLinhaStep({
  linhas,
  selected,
  onSelect,
  onSaved,
  refresh,
}: {
  linhas: TransporteRead<Linha>;
  selected: number | null;
  onSelect: (id: number) => void;
  onSaved: (notice: TransporteSaveNotice) => void;
  refresh: () => void;
}) {
  const { can } = useAuthz();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<LinhaFormValues>({
    name: "",
    description: "",
    departure_time: "",
    return_time: "",
    max_capacity: "",
  });
  const [errors, setErrors] = useState<LinhaFormErrors>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);
  async function create() {
    if (
      lock.current ||
      !acknowledged ||
      uncertain ||
      !can("linhas.write") ||
      !can("linhas.view")
    )
      return;
    const next = validateLinhaForm(values);
    setErrors(next);
    if (Object.keys(next).length) {
      scheduleFocusFirstFieldError(formRef.current);
      return;
    }
    if (
      linhas.data?.some(
        (l) =>
          l.name.trim().toLocaleLowerCase("pt-BR") ===
          values.name.trim().toLocaleLowerCase("pt-BR"),
      )
    ) {
      setError(
        "Já existe uma linha com este nome. Selecione o cadastro existente ou ajuste o nome para distinguir o atendimento.",
      );
      return;
    }
    const session = getQuerySessionVersion();
    lock.current = true;
    setBusy(true);
    setError("");
    let accepted = false;
    try {
      const response = await linhaService.create(buildLinhaPayload(values));
      accepted = true;
      const lines = await linhaService.list();
      if (session !== getQuerySessionVersion()) return;
      if (!response.data?.id || !lines.some((l) => l.id === response.data.id))
        throw Error("Resultado não confirmado");
      invalidateQueries();
      onSelect(response.data.id);
      onSaved({
        text: `Linha ${response.data.name}: cadastro conferido no servidor.`,
        confirmed: true,
      });
      setOpen(false);
    } catch (failure) {
      if (session !== getQuerySessionVersion()) return;
      setError(transporteError(failure).message);
      setErrors(transporteError(failure).fields);
      if (
        shouldReconcileGuidedFailure(
          true,
          accepted,
          axios.isAxiosError(failure) ? failure.response?.status : undefined,
        )
      ) {
        setUncertain(true);
        invalidateQueries();
        refresh();
        setError(
          "Resultado do envio não confirmado. Consulte as linhas atualizadas antes de repetir o cadastro na manutenção. Novo cadastro bloqueado nesta configuração.",
        );
        onSaved({
          text: "Cadastro de linha: resultado incerto; confira a lista atualizada.",
          confirmed: false,
        });
      }
    } finally {
      if (session === getQuerySessionVersion()) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-content-secondary">
        Escolha primeiro o atendimento existente. Uma nova linha precisa apenas
        de nome e capacidade; horários serão configurados na etapa própria.
      </p>
      <ReferenceSelect
        field={{ key: "linha_id", label: "Linha", required: true }}
        value={selected ? String(selected) : ""}
        records={linhas.data ?? []}
        failed={Boolean(linhas.error)}
        fetching={!linhas.data && !linhas.error}
        refresh={refresh}
        onChange={(e) => onSelect(Number(e.target.value))}
      />
      {can("linhas.write") && can("linhas.view") && (
        <Button
          variant="secondary"
          fullWidth={false}
          disabled={uncertain || Boolean(linhas.error) || !linhas.data}
          onClick={() => {
            setOpen(true);
            setAcknowledged(false);
          }}
        >
          Cadastrar nova linha
        </Button>
      )}
      <Modal
        open={open}
        title="Cadastrar linha"
        onClose={() => !busy && setOpen(false)}
        onSave={() => void create()}
        saveLabel="Confirmar cadastro"
        saveLoading={busy}
        saveDisabled={!acknowledged || uncertain}
      >
        <div className="space-y-4" ref={formRef}>
          <p className="text-sm">
            Este cadastro será gravado agora e continuará disponível mesmo se
            você sair do assistente. Confira as linhas existentes para evitar
            duplicação.
          </p>
          {error && (
            <p role="alert" className="text-sm text-danger-600">
              {error}
            </p>
          )}
          <LinhaFormFields
            basic
            values={values}
            errors={errors}
            onChange={(field, value) => {
              setValues((current) => ({ ...current, [field]: value }));
              setErrors((current) => ({ ...current, [field]: undefined }));
            }}
          />
          <Checkbox
            label="Conferi os cadastros existentes e quero gravar esta nova linha."
            checked={acknowledged}
            disabled={busy || uncertain}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
        </div>
      </Modal>
    </div>
  );
}
