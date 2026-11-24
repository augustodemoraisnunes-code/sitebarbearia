import Link from "next/link";
import { History, Search, Trash2, User } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import DangerForm from "@/components/admin/DangerForm";
import { removeClient, saveClient } from "@/lib/actions/clients";
import { listAppointments, listClients } from "@/lib/queries";
import { formatBRL, formatDateBR, formatPhoneBR } from "@/lib/format";
import { APPOINTMENT_STATUS_LABEL, type AppointmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cliente?: string; err?: string; ok?: string }>;
}) {
  const p = await searchParams;
  const { err, ok } = getFlash(p);
  const q = (p.q ?? "").trim();

  const clients = listClients(q);
  const allAppointments = listAppointments({ limit: 1000 });

  const statsByPhone = new Map<
    string,
    { count: number; lastDate: string; lastService: string; lastPrice: number }
  >();
  allAppointments
    .filter((a) => a.status !== "cancelled")
    .forEach((a) => {
      const key = a.client_phone_snapshot;
      const current = statsByPhone.get(key);
      if (!current) {
        statsByPhone.set(key, {
          count: 1,
          lastDate: a.appointment_date,
          lastService: a.service_name_snapshot,
          lastPrice: a.service_price_snapshot,
        });
      } else {
        current.count += 1;
        if (a.appointment_date >= current.lastDate) {
          current.lastDate = a.appointment_date;
          current.lastService = a.service_name_snapshot;
          current.lastPrice = a.service_price_snapshot;
        }
      }
    });

  const detailId = p.cliente ? Number(p.cliente) : null;
  const detail = detailId ? clients.find((c) => c.id === detailId) ?? null : null;
  const history = detail
    ? allAppointments
        .filter((a) => a.client_phone_snapshot === detail.phone)
        .sort((a, b) =>
          `${b.appointment_date}${b.start_time}`.localeCompare(
            `${a.appointment_date}${a.start_time}`
          )
        )
    : [];

  if (detail) {
    return (
      <>
        <PageHeader
          title={detail.name}
          description={`Cliente desde ${formatDateBR(detail.created_at.slice(0, 10))}`}
          actions={
            <Link href="/admin/clientes" className="btn btn-ghost-dark !py-3">
              ← Voltar à lista
            </Link>
          }
        />

        <FlashMessages err={err} ok={ok} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-ink/8 bg-white p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Dados do cliente
            </h2>

            <form action={saveClient} className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="id" value={detail.id} />
              <div>
                <label className="label !text-ink/60" htmlFor="c-name">
                  Nome
                </label>
                <input
                  id="c-name"
                  name="name"
                  defaultValue={detail.name}
                  className="field field-light !py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="label !text-ink/60" htmlFor="c-phone">
                  Telefone
                </label>
                <input
                  id="c-phone"
                  name="phone"
                  defaultValue={detail.phone}
                  className="field field-light !py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="label !text-ink/60" htmlFor="c-notes">
                  Observações
                </label>
                <textarea
                  id="c-notes"
                  name="notes"
                  defaultValue={detail.notes}
                  className="field field-light min-h-24 resize-y text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-bronze !py-3">Salvar</button>
              </div>
            </form>

            <DangerForm
              action={removeClient}
              confirmMessage={`Excluir ${detail.name}? O histórico de agendamentos será preservado.`}
              className="mt-4"
            >
              <input type="hidden" name="id" value={detail.id} />
              <button className="flex items-center gap-2 rounded-md border border-ink/15 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/60 hover:border-red-400 hover:text-red-600">
                <Trash2 size={14} /> Excluir cliente
              </button>
            </DangerForm>
          </div>

          <div className="rounded-lg border border-ink/8 bg-white p-6 lg:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Histórico ({history.length})
            </h2>
            {history.length === 0 ? (
              <p className="mt-5 text-sm text-ink/55">Nenhum agendamento registrado.</p>
            ) : (
              <ul className="mt-5 divide-y divide-ink/6">
                {history.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        {a.service_name_snapshot} · {formatBRL(a.service_price_snapshot)}
                      </span>
                      <span className="block text-xs text-ink/55">
                        {formatDateBR(a.appointment_date)} às {a.start_time}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${
                        a.status === "completed"
                          ? "bg-sky-100 text-sky-700"
                          : a.status === "cancelled"
                            ? "bg-neutral-200 text-neutral-600"
                            : a.status === "no_show"
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {APPOINTMENT_STATUS_LABEL[a.status as AppointmentStatus]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Consulta simples de quem já passou pela cadeira."
      />

      <FlashMessages err={err} ok={ok} />

      <form method="get" className="mb-6 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou telefone"
          className="field field-light max-w-md !py-3 text-sm"
        />
        <button className="btn btn-ghost-dark !py-3">
          <Search size={14} /> Buscar
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-ink/8 bg-white">
        {clients.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-ink/55">
            {q ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
        ) : (
          <ul className="divide-y divide-ink/6">
            {clients.map((c) => {
              const st = statsByPhone.get(c.phone);
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-bronze-deep">
                      <User size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-ink">{c.name}</span>
                      <a
                        href={`tel:${c.phone.replace(/\D/g, "")}`}
                        className="block text-xs text-ink/55 hover:text-bronze-deep"
                      >
                        {formatPhoneBR(c.phone)}
                      </a>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs text-ink/60">
                    <span>
                      <span className="display-title mr-1.5 text-lg text-ink">
                        {st?.count ?? 0}
                      </span>
                      agend.
                    </span>
                    <span>
                      Último:{" "}
                      {st ? formatDateBR(st.lastDate) : "—"}
                    </span>
                    {st && <span className="text-ink/45">{st.lastService}</span>}
                  </div>

                  <Link
                    href={`/admin/clientes?cliente=${c.id}`}
                    className="flex items-center gap-1.5 rounded-md border border-ink/15 px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
                  >
                    <History size={13} /> Histórico
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
