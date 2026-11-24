import { CalendarOff, Clock4, Coffee, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import DangerForm from "@/components/admin/DangerForm";
import {
  addBlockAction,
  addBreakAction,
  removeBlock,
  removeBreak,
  saveWorkingHours,
} from "@/lib/actions/schedule";
import { listBlocks, listBreaks, listBusinessHours } from "@/lib/queries";

export const dynamic = "force-dynamic";

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export default async function WorkingHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { err, ok } = getFlash(await searchParams);
  const hours = listBusinessHours();
  const breaks = listBreaks();
  const blocks = listBlocks();

  return (
    <>
      <PageHeader
        title="Horários e bloqueios"
        description="Defina seu expediente, as pausas e bloqueie períodos. Tudo é refletido no calendário público na hora."
      />

      <FlashMessages err={err} ok={ok} />

      {/* Expediente */}
      <form action={saveWorkingHours} className="rounded-lg border border-ink/8 bg-white p-6">
        <div className="flex items-center gap-2">
          <Clock4 size={16} className="text-bronze-deep" />
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Horário de funcionamento
          </h2>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {WEEKDAYS.map((day) => {
            const h = hours.find((x) => x.weekday === day.value);
            const open = h?.is_open ?? false;
            return (
              <div
                key={day.value}
                className="grid grid-cols-1 items-center gap-3 rounded-md border border-ink/8 bg-cream/60 p-4 sm:grid-cols-[180px_1fr_auto]"
              >
                <label className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    name={`open_${day.value}`}
                    defaultChecked={open}
                    className="h-4 w-4 accent-[#C6A164]"
                  />
                  {day.label}
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    name={`opening_${day.value}`}
                    defaultValue={h?.opening_time ?? "09:00"}
                    className="field field-light w-auto !py-2 text-sm"
                    disabled={!open}
                  />
                  <span className="text-ink/40">até</span>
                  <input
                    type="time"
                    name={`closing_${day.value}`}
                    defaultValue={h?.closing_time ?? "19:00"}
                    className="field field-light w-auto !py-2 text-sm"
                    disabled={!open}
                  />
                </div>

                <span
                  className={`justify-self-start rounded-full px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] sm:justify-self-end ${
                    open ? "bg-emerald-100 text-emerald-700" : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {open ? "Aberto" : "Fechado"}
                </span>
              </div>
            );
          })}
        </div>

        <button className="btn btn-bronze mt-5 !py-3">Salvar expediente</button>
      </form>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pausas */}
        <div className="rounded-lg border border-ink/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <Coffee size={16} className="text-bronze-deep" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Pausas e intervalos
            </h2>
          </div>
          <p className="mt-1 text-xs text-ink/55">
            Horários que nunca aparecem para os clientes (almoço, pausas…).
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {breaks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-md bg-cream px-4 py-3"
              >
                <span className="text-sm text-ink">
                  <span className="font-semibold">
                    {WEEKDAYS.find((w) => w.value === b.weekday)?.label}
                  </span>{" "}
                  · {b.start_time}–{b.end_time}
                  {b.description && (
                    <span className="ml-2 text-ink/55">({b.description})</span>
                  )}
                </span>
                <DangerForm
                  action={removeBreak}
                  confirmMessage="Remover esta pausa?"
                >
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    aria-label="Remover pausa"
                    className="text-ink/45 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </DangerForm>
              </li>
            ))}
            {breaks.length === 0 && (
              <li className="text-sm text-ink/50">Nenhuma pausa cadastrada.</li>
            )}
          </ul>

          <form action={addBreakAction} className="mt-5 grid grid-cols-2 gap-3 rounded-md border border-dashed border-ink/15 p-4 sm:grid-cols-4">
            <select name="weekday" className="field field-light !py-2 text-sm">
              {WEEKDAYS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              name="start_time"
              defaultValue="12:00"
              className="field field-light !py-2 text-sm"
            />
            <input
              type="time"
              name="end_time"
              defaultValue="13:30"
              className="field field-light !py-2 text-sm"
            />
            <input
              name="description"
              placeholder="Descrição"
              className="field field-light !py-2 text-sm"
            />
            <button className="btn btn-ghost-dark col-span-2 !py-2.5 sm:col-span-4">
              <Plus size={14} /> Adicionar pausa
            </button>
          </form>
        </div>

        {/* Bloqueios */}
        <div className="rounded-lg border border-ink/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <CalendarOff size={16} className="text-bronze-deep" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Bloqueio de horários
            </h2>
          </div>
          <p className="mt-1 text-xs text-ink/55">
            Férias, compromissos, manutenção — o dia ou período sai da
            disponibilidade imediatamente.
          </p>

          <ul className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-md bg-cream px-4 py-3"
              >
                <span className="text-sm text-ink">
                  <span className="font-semibold">
                    {b.start_datetime.replace("T", " ").slice(0, 16)} →{" "}
                    {b.end_datetime.replace("T", " ").slice(0, 16)}
                  </span>
                  {b.reason && <span className="ml-2 text-ink/55">· {b.reason}</span>}
                </span>
                <DangerForm
                  action={removeBlock}
                  confirmMessage="Remover este bloqueio?"
                >
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    aria-label="Remover bloqueio"
                    className="text-ink/45 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </DangerForm>
              </li>
            ))}
            {blocks.length === 0 && (
              <li className="text-sm text-ink/50">Nenhum bloqueio cadastrado.</li>
            )}
          </ul>

          <form action={addBlockAction} className="mt-5 grid grid-cols-2 gap-3 rounded-md border border-dashed border-ink/15 p-4">
            <input
              type="date"
              name="date"
              required
              className="field field-light !py-2 text-sm"
            />
            <input
              name="reason"
              placeholder="Motivo (ex.: férias)"
              className="field field-light !py-2 text-sm"
            />
            <input
              type="time"
              name="start_time"
              defaultValue="09:00"
              className="field field-light !py-2 text-sm"
            />
            <input
              type="time"
              name="end_time"
              defaultValue="18:00"
              className="field field-light !py-2 text-sm"
            />
            <label className="col-span-2 flex items-center gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                name="all_day"
                className="h-4 w-4 accent-[#C6A164]"
              />
              Bloquear o dia inteiro
            </label>
            <button className="btn btn-ghost-dark col-span-2 !py-2.5">
              <Plus size={14} /> Bloquear período
            </button>
          </form>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink/50">
        Dica: bloqueios de dia inteiro aparecem como indisponíveis no calendário
        do site assim que forem salvos.{" "}
        {blocks.length > 0 && `Total: ${blocks.length} bloqueio(s).`}
      </p>
    </>
  );
}
