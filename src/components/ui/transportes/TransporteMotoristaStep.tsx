"use client";

import axios from "axios";
import { useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Checkbox } from "@/components/form/inputs";
import { UserFormModal } from "@/components/ui/users/UserFormModal";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { linhaService } from "@/services/api/modules/linha";
import { userService } from "@/services/api/modules/user";
import { driversQuery } from "@/services/api/page-queries";
import {
  getQuerySessionVersion,
  invalidateQueries,
} from "@/services/api/query-cache";
import type { Linha } from "@/types/inscricao";
import type { TransporteSaveNotice } from "@/types/transporte-operacao";
import type { UserFormErrors, UserPayload } from "@/types/user";
import { ReferenceSelect } from "./TransporteReferenceField";
import {
  buildMotoristaUpdate,
  shouldReconcileGuidedFailure,
} from "./transporteOperacaoPresentation";
import { getTransporteValue, transporteError } from "./transportePresentation";

export function TransporteMotoristaStep({
  linha,
  onSaved,
  readOnly = false,
}: {
  linha: Linha;
  onSaved: (notice: TransporteSaveNotice) => void;
  readOnly?: boolean;
}) {
  const { can } = useAuthz();
  const drivers = useCachedQuery(driversQuery, can("linhas.write"));
  const [selected, setSelected] = useState(
    String(linha.motorista_id ?? linha.motorista?.id ?? ""),
  );
  const [ack, setAck] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<UserFormErrors>({});
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  async function run(
    write: (mark: (phase: "sent" | "accepted") => void) => Promise<void>,
    description: string,
  ) {
    if (lock.current || uncertain || readOnly) return;
    const session = getQuerySessionVersion();
    lock.current = true;
    setBusy(true);
    setError("");
    let accepted = false;
    let sent = false;
    try {
      await write((phase) => {
        if (phase === "sent") sent = true;
        else accepted = true;
      });
      if (session !== getQuerySessionVersion()) return;
      invalidateQueries();
      onSaved({ text: description, confirmed: true });
    } catch (failure) {
      if (session !== getQuerySessionVersion()) return;
      setError(
        failure instanceof Error && !axios.isAxiosError(failure)
          ? failure.message
          : transporteError(failure).message,
      );
      setFields(transporteError(failure).fields);
      if (
        shouldReconcileGuidedFailure(
          sent,
          accepted,
          axios.isAxiosError(failure) ? failure.response?.status : undefined,
        )
      ) {
        setUncertain(true);
        invalidateQueries();
        await drivers.refresh();
        setError(
          "Resultado do envio não confirmado. Confira motoristas e linha na manutenção; novos envios ficam bloqueados nesta configuração.",
        );
        onSaved({
          text: "Motorista: resultado de gravação a conferir na manutenção.",
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
  async function saveDriver() {
    if (!can("linhas.write") || !ack || !linha.max_capacity) return;
    await run(async (mark) => {
      const fresh = (await linhaService.list()).find((l) => l.id === linha.id);
      if (!fresh)
        throw Error(
          "A linha não está disponível na consulta atual. Atualize antes de alterar o responsável.",
        );
      const payload = buildMotoristaUpdate(
        fresh,
        selected ? Number(selected) : null,
      );
      mark("sent");
      await linhaService.update(linha.id, payload);
      mark("accepted");
      const check = await linhaService.list();
      const saved = check.find((l) => l.id === linha.id);
      if (
        !saved ||
        (saved.motorista_id ?? saved.motorista?.id ?? null) !==
          (selected ? Number(selected) : null)
      )
        throw Error("Resultado não confirmado");
    }, "Motorista responsável da linha: alteração conferida no servidor.");
  }
  async function createDriver(payload: UserPayload) {
    if (!can("users.write") || !can("linhas.write")) return;
    await run(async (mark) => {
      mark("sent");
      const response = await userService.create({
        ...payload,
        role: "motorista",
      });
      mark("accepted");
      const id =
        getTransporteValue(response, "data.id") ??
        getTransporteValue(response, "id");
      const list = await userService.listDrivers();
      const created = list.find((d) => d.id === id);
      if (!created) throw Error("Cadastro não confirmado");
      setSelected(String(created.id));
      setOpen(false);
      setAck(false);
    }, "Novo motorista: cadastro conferido. O vínculo com a linha ainda precisa ser confirmado.");
  }
  return (
    <section className="space-y-4 rounded-xl border border-border-subtle bg-white p-4">
      <h3 className="font-bold text-brand-700">Motorista responsável</h3>
      <p className="text-sm">
        Atual: {linha.motorista?.name ?? "Não informado"}. Alterar o responsável
        também muda o acesso à chamada desta linha. O veículo não determina o
        motorista.
      </p>
      {can("linhas.write") ? (
        <>
          <ReferenceSelect
            field={{ key: "motorista_id", label: "Motorista" }}
            value={selected}
            disabled={busy || uncertain || readOnly}
            records={drivers.data ?? []}
            fetching={drivers.isFetching}
            failed={Boolean(drivers.error)}
            refresh={() => void drivers.refresh()}
            onChange={(e) => {
              setSelected(e.target.value);
              setAck(false);
            }}
          />
          <Checkbox
            label="Quero gravar agora o responsável da linha e alterar seu acesso à chamada."
            checked={ack}
            disabled={busy || uncertain || readOnly}
            onChange={(e) => setAck(e.target.checked)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              fullWidth={false}
              loading={busy}
              disabled={
                !ack || uncertain || !!drivers.error || !linha.max_capacity
              }
              onClick={() => void saveDriver()}
            >
              Gravar responsável
            </Button>
            {can("users.write") && (
              <Button
                size="sm"
                fullWidth={false}
                variant="secondary"
                disabled={busy || uncertain}
                onClick={() => setOpen(true)}
              >
                Cadastrar motorista
              </Button>
            )}
          </div>
          <p className="text-xs text-content-muted">
            Cadastrar motorista grava um usuário compartilhado. O vínculo com
            esta linha é uma ação separada.
          </p>
        </>
      ) : (
        <p className="text-sm text-content-muted">
          Seu perfil permite conferir, mas não alterar o responsável. Solicite a
          alteração à gestão.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger-600">
          {error}
        </p>
      )}
      <UserFormModal
        fixedRole="motorista"
        open={open}
        user={null}
        loading={busy}
        error={error}
        fieldErrors={fields}
        onClearError={(field) =>
          setFields((current) => ({ ...current, [field]: undefined }))
        }
        onClose={() => !busy && setOpen(false)}
        onSubmit={(payload) => void createDriver(payload)}
      />
    </section>
  );
}
