"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/buttons";
import { Input, Select } from "@/components/form/inputs";
import { useCachedQuery } from "@/hooks/use-cached-query";
import {
  studentReferenceQuery,
  studentSearchQuery,
} from "@/services/api/page-queries";
import type { TransporteField } from "./transporteConfig";

export function TransporteEstudanteField({
  field,
  value,
  disabled,
  error,
  onChange,
}: {
  field: TransporteField;
  value: string;
  disabled?: boolean;
  error?: string;
  onChange: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ search: "", page: 1 });
  const result = useCachedQuery(studentSearchQuery, query.search, query.page);
  const selected = useCachedQuery(studentReferenceQuery, value);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setQuery((current) =>
        current.search === search.trim()
          ? current
          : { search: search.trim(), page: 1 },
      );
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const options = (result.data?.data ?? []).map((student) => ({
    value: String(student.id),
    label: [
      student.name,
      student.instituicao?.name ?? student.instituicao_name,
      student.course,
      student.situacao,
    ]
      .filter(Boolean)
      .join(" — "),
  }));
  if (value && !options.some((option) => option.value === value)) {
    options.unshift({
      value,
      label: selected.data?.name ?? "Estudante selecionado (fora desta página)",
    });
  }
  const pending =
    result.isLoading || result.isFetching || query.search !== search.trim();
  const meta = result.data?.meta;
  if (!field.required)
    options.unshift({ value: "", label: "Todos os estudantes" });
  return (
    <div className="min-w-0 space-y-3">
      <Input
        label="Pesquisar estudante por nome"
        value={search}
        maxLength={100}
        disabled={disabled}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Select
        label="Estudante"
        name={field.key}
        value={value}
        options={options}
        disabled={disabled || pending || Boolean(result.error)}
        required={field.required}
        error={error}
        hint={field.hint}
        onChange={onChange}
        placeholder={
          pending ? "Buscando estudantes..." : "Selecione o estudante"
        }
      />
      <div aria-live="polite" className="text-xs text-content-muted">
        {result.error ? (
          <div role="alert" className="space-y-2">
            <p>Não foi possível consultar os estudantes.</p>
            <Button
              size="sm"
              fullWidth={false}
              variant="secondary"
              disabled={disabled}
              onClick={() => void result.refresh()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : pending ? (
          "Buscando estudantes..."
        ) : result.data?.data.length === 0 ? (
          "Nenhum estudante encontrado."
        ) : meta ? (
          `Página ${meta.current_page} de ${meta.last_page} · ${meta.total} estudante(s)`
        ) : null}
      </div>
      {meta && meta.last_page > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            fullWidth={false}
            variant="secondary"
            disabled={disabled || pending || query.page <= 1}
            onClick={() =>
              setQuery((current) => ({ ...current, page: current.page - 1 }))
            }
          >
            Anterior
          </Button>
          <Button
            size="sm"
            fullWidth={false}
            variant="secondary"
            disabled={disabled || pending || query.page >= meta.last_page}
            onClick={() =>
              setQuery((current) => ({ ...current, page: current.page + 1 }))
            }
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
