"use client";

import {
  ArrowRight,
  BusFront,
  Clock3,
  IdCard,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/buttons";
import type { Linha } from "@/types/inscricao";
import { cn } from "@/utils/cn";
import {
  horaParaInput,
  type LinhasViewMode,
  ocupacaoDe,
} from "./linhaPresentation";

const CARD_COLORS = [
  { border: "border-l-blue-500", icon: "bg-blue-100 text-blue-600" },
  { border: "border-l-emerald-500", icon: "bg-emerald-100 text-emerald-700" },
  { border: "border-l-amber-500", icon: "bg-amber-100 text-amber-700" },
  { border: "border-l-violet-500", icon: "bg-violet-100 text-violet-600" },
];

export function LinhaCard({
  linha,
  onEdit,
  onDelete,
  onDetails,
  viewMode = "grid",
}: {
  linha: Linha;
  onEdit?: (linha: Linha) => void;
  onDelete?: (linha: Linha) => void;
  onDetails: (linha: Linha) => void;
  viewMode?: LinhasViewMode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLFieldSetElement>(null);
  const menuId = useId();
  const titleId = useId();
  const color = CARD_COLORS[Math.abs(linha.id - 1) % CARD_COLORS.length];
  const { ocupacao, capacidade, vagas, lotada, proporcao } = ocupacaoDe(linha);
  const percentage =
    capacidade > 0 ? Math.round((ocupacao / capacidade) * 100) : 0;

  useEffect(() => {
    if (!menuOpen) return;
    function closeOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      )
        setMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const actions = [
    {
      label: "Ver detalhes",
      icon: <ArrowRight />,
      run: () => onDetails(linha),
    },
    ...(onEdit
      ? [{ label: "Editar", icon: <Pencil />, run: () => onEdit(linha) }]
      : []),
    ...(onDelete
      ? [
          {
            label: "Excluir",
            icon: <Trash2 />,
            run: () => onDelete(linha),
            danger: true,
          },
        ]
      : []),
  ];

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "relative flex min-w-0 flex-col rounded-lg border border-brand-600/10 border-l-[3px] bg-white p-4 shadow-sm",
        color.border,
        menuOpen && "z-[1]",
        viewMode === "list" &&
          "xl:grid xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] xl:items-center xl:gap-6 xl:pr-16",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            color.icon,
          )}
        >
          <BusFront aria-hidden="true" className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="break-words text-sm font-bold text-brand-700"
          >
            {linha.name}
          </h2>
          <p
            className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-content-muted"
            title={linha.description ?? undefined}
          >
            {linha.description || "Descrição da rota não informada."}
          </p>
        </div>
        <span
          className={cn(
            "mt-1 shrink-0 rounded-md px-2 py-1 text-[10px] font-bold",
            lotada
              ? "bg-danger-600/10 text-danger-600"
              : "bg-emerald-100 text-emerald-700",
          )}
        >
          {lotada ? "Lotada" : `${vagas} vaga(s)`}
        </span>
        <fieldset
          className={cn(
            "relative -mr-2 min-w-0 shrink-0",
            viewMode === "list" &&
              "xl:absolute xl:right-4 xl:top-1/2 xl:mr-0 xl:-translate-y-1/2",
          )}
          aria-label={`Ações de ${linha.name}`}
          ref={menuRef}
          onBlur={(event) => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(event.relatedTarget)
            )
              setMenuOpen(false);
          }}
        >
          <Button
            aria-label={`Ações de ${linha.name}`}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            className="border-0 bg-transparent p-3 shadow-none"
            leftIcon={<MoreVertical />}
            size="icon"
            variant="ghost"
            onClick={() => setMenuOpen((open) => !open)}
          />
          {menuOpen && (
            <div
              id={menuId}
              className="absolute right-0 top-full z-20 mt-2 w-40 rounded-lg border border-brand-600/10 bg-white p-1 shadow-lg"
            >
              {actions.map((action) => (
                <Button
                  key={action.label}
                  className={cn(
                    "justify-start border-0 text-sm shadow-none",
                    action.danger &&
                      "text-danger-600 hover:bg-danger-600/10 active:bg-danger-600/15 focus-visible:outline-danger-600",
                  )}
                  leftIcon={action.icon}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMenuOpen(false);
                    action.run();
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </fieldset>
      </div>

      <dl
        className={cn(
          "mt-4 grid grid-cols-2 gap-3",
          viewMode === "list" && "xl:mt-0",
        )}
      >
        {[
          { label: "Saída", value: horaParaInput(linha.departure_time) },
          { label: "Retorno", value: horaParaInput(linha.return_time) },
        ].map((time) => (
          <div
            key={time.label}
            className="flex items-center gap-3 rounded-lg bg-surface-muted px-3 py-2"
          >
            <Clock3
              aria-hidden="true"
              className="size-4 shrink-0 text-brand-600"
            />
            <div>
              <dt className="text-[10px] font-semibold text-brand-600">
                {time.label}
              </dt>
              <dd
                className={cn(
                  "text-sm tabular-nums text-brand-700",
                  time.label === "Saída" && "font-bold",
                )}
              >
                {time.value || "—"}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div className={cn("mt-3", viewMode === "list" && "xl:mt-0")}>
        <p className="mb-3 flex items-center gap-2 text-xs text-content-secondary">
          <IdCard aria-hidden="true" className="size-4 text-brand-600" />
          <span className="truncate">
            {linha.motorista?.name ?? "Motorista não vinculado"}
          </span>
        </p>
        <div className="mb-1 flex justify-between gap-2 text-xs">
          <span className="font-bold text-brand-700">Ocupação</span>
          <span className="tabular-nums text-content-muted">
            {ocupacao} de {capacidade}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-100"
          aria-hidden="true"
        >
          <div
            className={cn(
              "h-full rounded-full",
              lotada ? "bg-danger-600" : "bg-brand-600",
            )}
            style={{ width: `${proporcao * 100}%` }}
          />
        </div>
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-[10px] font-bold",
            lotada ? "text-danger-600" : "text-brand-600",
          )}
        >
          <BusFront aria-hidden="true" className="size-3" /> {percentage}% de
          ocupação
        </p>
      </div>
    </article>
  );
}

export function LinhaCreateCard({ onCreate }: { onCreate: () => void }) {
  return (
    <article className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-brand-600/20 bg-white/40 p-6 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-600/5 text-brand-600">
        <BusFront aria-hidden="true" className="size-6" />
      </span>
      <h2 className="text-sm font-bold text-brand-700">Adicionar nova linha</h2>
      <p className="mb-4 mt-1 max-w-64 text-xs text-content-muted">
        Cadastre uma nova linha de transporte para atender mais estudantes.
      </p>
      <Button
        className="h-10 px-4 text-sm"
        fullWidth={false}
        leftIcon={<Plus />}
        onClick={onCreate}
        size="md"
        variant="primary"
      >
        Nova linha
      </Button>
    </article>
  );
}
