import type { ReactNode } from "react";

export function Card({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-sm"} rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/15 dark:bg-zinc-900`}
      >
        <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-base dark:border-white/20";

export function Field(props: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string | number;
  required?: boolean;
  inputMode?: "numeric" | "text";
  min?: number;
  max?: number;
}) {
  return (
    <label className="mb-4 block text-sm font-medium">
      {props.label}
      <input
        name={props.name}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        defaultValue={props.defaultValue}
        required={props.required ?? true}
        inputMode={props.inputMode}
        min={props.min}
        max={props.max}
        className={inputClass}
      />
    </label>
  );
}

export function Select(props: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="mb-4 block text-sm font-medium">
      {props.label}
      <select name={props.name} defaultValue={props.defaultValue} className={inputClass}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Message({ state }: { state?: { message?: string; ok?: boolean } }) {
  if (!state?.message) return null;
  return (
    <p role={state.ok ? "status" : "alert"} className={`mb-4 text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
      {state.message}
    </p>
  );
}

export function Loading() {
  return <p className="opacity-70">Loading…</p>;
}

export const buttonClass =
  "w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60";

export const secondaryButtonClass =
  "rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

export const dangerButtonClass =
  "w-full rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 disabled:opacity-60";
