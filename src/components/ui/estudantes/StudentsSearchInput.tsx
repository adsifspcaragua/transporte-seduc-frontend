"use client";

import { Search } from "lucide-react";
import type { ChangeEventHandler } from "react";

type StudentsSearchInputProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
};

export function StudentsSearchInput({
  value,
  onChange,
  placeholder = "Pesquise por alunos, instituições ou linhas...",
}: StudentsSearchInputProps) {
  return (
    <div className="flex h-10 w-full max-w-xl items-center rounded-md bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-brand-600/40">
      <span className="flex h-full w-11 shrink-0 items-center justify-center border-r border-slate-200 text-brand-600">
        <Search className="size-4" />
      </span>
      <input
        className="h-full min-w-0 flex-1 px-3 text-xs outline-none placeholder:text-slate-400"
        onChange={onChange}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </div>
  );
}
