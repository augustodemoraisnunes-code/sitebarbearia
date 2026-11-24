import { Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import DangerForm from "@/components/admin/DangerForm";
import ImagePicker from "@/components/admin/ImagePicker";
import { removeService, saveService } from "@/lib/actions/services";
import { listServices } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import type { Service } from "@/lib/types";

export const dynamic = "force-dynamic";

function ServiceForm({ service }: { service?: Service }) {
  const isNew = !service;
  return (
    <form
      action={saveService}
      className="rounded-lg border border-ink/8 bg-white p-5"
    >
      {service && <input type="hidden" name="id" value={service.id} />}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
          {isNew ? "Novo serviço" : `#${service.id} · ${service.name}`}
        </h2>
        {service && (
          <span
            className={`rounded-full px-3 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${
              service.is_active
                ? "bg-emerald-100 text-emerald-700"
                : "bg-neutral-200 text-neutral-600"
            }`}
          >
            {service.is_active ? "Ativo" : "Inativo"}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="label !text-ink/60" htmlFor={`name-${service?.id ?? "new"}`}>
            Nome
          </label>
          <input
            id={`name-${service?.id ?? "new"}`}
            name="name"
            defaultValue={service?.name ?? ""}
            placeholder="Ex.: Degradê / Fade"
            className="field field-light !py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor={`price-${service?.id ?? "new"}`}>
            Preço (R$)
          </label>
          <input
            id={`price-${service?.id ?? "new"}`}
            name="price"
            type="number"
            min="0"
            step="0.5"
            defaultValue={service?.price ?? 45}
            className="field field-light !py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label
            className="label !text-ink/60"
            htmlFor={`duration-${service?.id ?? "new"}`}
          >
            Duração (min)
          </label>
          <input
            id={`duration-${service?.id ?? "new"}`}
            name="duration_minutes"
            type="number"
            min="5"
            step="5"
            defaultValue={service?.duration_minutes ?? 40}
            className="field field-light !py-2.5 text-sm"
            required
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label
            className="label !text-ink/60"
            htmlFor={`desc-${service?.id ?? "new"}`}
          >
            Descrição
          </label>
          <textarea
            id={`desc-${service?.id ?? "new"}`}
            name="description"
            defaultValue={service?.description ?? ""}
            placeholder="Descrição exibida no site"
            className="field field-light min-h-16 resize-y text-sm"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <ImagePicker
            label="Imagem do serviço"
            name="image_url"
            initialUrl={service?.image_url ?? ""}
            hint="Opcional. Deixe em branco para usar o espaço reservado no site."
          />
        </div>

        <div className="flex flex-col justify-end gap-3">
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={service?.is_active ?? true}
              className="h-4 w-4 accent-[#C6A164]"
            />
            Serviço ativo (visível no site)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              name="sort_order"
              defaultValue={service?.sort_order ?? 0}
              className="field field-light w-24 !py-2 text-xs"
              title="Ordem de exibição"
            />
            <span className="text-[0.6rem] uppercase tracking-wide text-ink/45">
              ordem
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-bronze !py-3">
          {isNew ? "Criar serviço" : "Salvar alterações"}
        </button>
        {service && (
          <DangerForm
            action={removeService}
            confirmMessage={`Excluir o serviço "${service.name}"? Os agendamentos antigos mantêm os dados registrados.`}
          >
            <input type="hidden" name="id" value={service.id} />
            <button className="flex items-center gap-2 rounded-md border border-ink/15 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/60 hover:border-red-400 hover:text-red-600">
              <Trash2 size={14} /> Excluir
            </button>
          </DangerForm>
        )}
      </div>
    </form>
  );
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { err, ok } = getFlash(await searchParams);
  const services = listServices(true);

  return (
    <>
      <PageHeader
        title="Gestão de serviços"
        description="Cadastre serviços, preços e durações. Alterações aparecem imediatamente no site e no agendamento."
      />

      <FlashMessages err={err} ok={ok} />

      <div className="mb-8 flex flex-col gap-5">
        <ServiceForm />
        {services.map((s) => (
          <ServiceForm key={s.id} service={s} />
        ))}
      </div>

      <div className="rounded-lg border border-ink/8 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
          Resumo
        </h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-md bg-cream px-4 py-2.5 text-sm"
            >
              <span className="font-semibold text-ink">{s.name}</span>
              <span className="text-bronze-deep">{formatBRL(s.price)}</span>
              <span className="text-ink/45">{s.duration_minutes} min</span>
              {!s.is_active && (
                <span className="text-[0.6rem] font-bold uppercase text-ink/40">
                  inativo
                </span>
              )}
            </li>
          ))}
          {services.length === 0 && (
            <li className="flex items-center gap-2 text-sm text-ink/55">
              <Plus size={14} /> Cadastre o primeiro serviço acima.
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
