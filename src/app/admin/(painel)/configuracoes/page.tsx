import { KeyRound, Save, Settings2, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import ImagePicker from "@/components/admin/ImagePicker";
import {
  changePassword,
  saveWebsiteSettings,
} from "@/lib/actions/settings";
import { getCurrentAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

function Field({
  id,
  label,
  name,
  value,
  type = "text",
  hint,
  area = false,
  required = false,
}: {
  id: string;
  label: string;
  name: string;
  value: string;
  type?: string;
  hint?: string;
  area?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label !text-ink/60" htmlFor={id}>
        {label}
      </label>
      {area ? (
        <textarea
          id={id}
          name={name}
          defaultValue={value}
          required={required}
          className="field field-light min-h-24 resize-y text-sm"
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          className="field field-light !py-2.5 text-sm"
        />
      )}
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { err, ok } = getFlash(await searchParams);
  const s = getSettings();
  const admin = await getCurrentAdmin();

  return (
    <>
      <PageHeader
        title="Configurações do website"
        description="Altere textos, contatos, fotos de capa e regras do agendamento sem tocar no código."
      />

      <FlashMessages err={err} ok={ok} />

      <form action={saveWebsiteSettings} className="flex flex-col gap-6">
        {/* Marca e textos */}
        <section className="rounded-lg border border-ink/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-bronze-deep" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Marca e textos principais
            </h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field id="business_name" label="Nome da barbearia" name="business_name" value={s.business_name} required />
            <Field id="tagline" label="Slogan" name="tagline" value={s.tagline} />
            <Field id="hero_kicker" label="Texto superior do hero" name="hero_kicker" value={s.hero_kicker} />
            <Field id="hero_title" label="Título do hero" name="hero_title" value={s.hero_title} required />
            <div className="md:col-span-2">
              <Field
                id="hero_description"
                label="Descrição do hero"
                name="hero_description"
                value={s.hero_description}
                area
              />
            </div>
          </div>

          <div className="mt-5">
            <ImagePicker
              label="Foto de destaque do hero"
              name="hero_image"
              initialUrl={s.hero_image}
              hint="Recomendado: foto horizontal do barbeiro trabalhando ou do ambiente."
            />
          </div>
        </section>

        {/* Barbeiro */}
        <section className="rounded-lg border border-ink/8 bg-white p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Apresentação do barbeiro
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field id="barber_name" label="Nome do barbeiro" name="barber_name" value={s.barber_name} />
            <Field id="barber_role" label="Cargo / função" name="barber_role" value={s.barber_role} />
            <Field id="barber_years" label="Anos de experiência" name="barber_years" value={s.barber_years} />
            <Field
              id="barber_specialties"
              label="Especialidades"
              name="barber_specialties"
              value={s.barber_specialties}
              hint="Separe por vírgula."
            />
            <div className="md:col-span-2">
              <Field
                id="barber_bio"
                label="História / filosofia de trabalho"
                name="barber_bio"
                value={s.barber_bio}
                area
              />
            </div>
          </div>

          <div className="mt-5">
            <ImagePicker
              label="Retrato do barbeiro"
              name="about_image"
              initialUrl={s.about_image}
              hint="Foto vertical, com iluminação lateral e fundo escuro."
            />
          </div>

          <div className="mt-5">
            <ImagePicker
              label="Foto de capa da galeria do ambiente"
              name="environment_cover"
              initialUrl={s.environment_cover}
              hint="Imagem principal da seção “Nosso ambiente”."
            />
          </div>
        </section>

        {/* Contato */}
        <section className="rounded-lg border border-ink/8 bg-white p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Contato e localização
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field id="phone" label="Telefone" name="phone" value={s.phone} />
            <Field
              id="whatsapp"
              label="WhatsApp (só números com DDI)"
              name="whatsapp"
              value={s.whatsapp}
              hint="Ex.: 5511999999999"
            />
            <Field id="instagram" label="Instagram (URL)" name="instagram" value={s.instagram} />
            <Field id="address" label="Endereço" name="address" value={s.address} />
            <div className="md:col-span-2">
              <Field
                id="schedule_display"
                label="Horários exibidos no site"
                name="schedule_display"
                value={s.schedule_display}
              />
            </div>
            <div className="md:col-span-2">
              <Field
                id="map_url"
                label="Google Maps (URL de incorporação)"
                name="map_url"
                value={s.map_url}
                hint="No Google Maps: Compartilhar → Incorporar um mapa → copie o src."
              />
            </div>
          </div>
        </section>

        {/* Regras do agendamento */}
        <section className="rounded-lg border border-bronze/40 bg-white p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Regras do agendamento
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              id="slot_interval_minutes"
              label="Intervalo da grade (min)"
              name="slot_interval_minutes"
              type="number"
              value={s.slot_interval_minutes}
              hint="Passo dos horários sugeridos."
            />
            <Field
              id="buffer_minutes"
              label="Margem entre atendimentos (min)"
              name="buffer_minutes"
              type="number"
              value={s.buffer_minutes}
              hint="Tempo extra entre um cliente e outro."
            />
            <Field
              id="min_notice_minutes"
              label="Antecedência mínima (min)"
              name="min_notice_minutes"
              type="number"
              value={s.min_notice_minutes}
              hint="Ex.: 60 = só agenda com 1h de antecedência."
            />
            <Field
              id="max_days_ahead"
              label="Limite de dias futuros"
              name="max_days_ahead"
              type="number"
              value={s.max_days_ahead}
              hint="Quantos dias à frente o cliente pode reservar."
            />
          </div>
        </section>

        <div className="flex justify-end">
          <button className="btn btn-bronze !py-3.5">
            <Save size={16} /> Salvar configurações
          </button>
        </div>
      </form>

      {/* Conta */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-ink/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-bronze-deep" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Dados de acesso
            </h2>
          </div>
          <form action={saveWebsiteSettings} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="label !text-ink/60" htmlFor="admin_name">
                Nome exibido no painel
              </label>
              <input
                id="admin_name"
                name="admin_name"
                defaultValue={admin?.name ?? ""}
                className="field field-light !py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="label !text-ink/60" htmlFor="admin_email">
                E-mail de acesso
              </label>
              <input
                id="admin_email"
                value={admin?.email ?? ""}
                disabled
                className="field field-light !py-2.5 text-sm opacity-60"
              />
              <p className="mt-1.5 text-xs text-ink/45">
                O e-mail de acesso é fixo e não pode ser alterado por aqui.
              </p>
            </div>
            <button className="btn btn-ghost-dark self-start !py-3">
              Salvar nome
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-ink/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-bronze-deep" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Alterar senha
            </h2>
          </div>
          <form action={changePassword} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="label !text-ink/60" htmlFor="current_password">
                Senha atual
              </label>
              <input
                id="current_password"
                name="current_password"
                type="password"
                required
                autoComplete="current-password"
                className="field field-light !py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="label !text-ink/60" htmlFor="new_password">
                Nova senha (mínimo 8 caracteres)
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="field field-light !py-2.5 text-sm"
              />
            </div>
            <button className="btn btn-ghost-dark self-start !py-3">
              Alterar senha
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
