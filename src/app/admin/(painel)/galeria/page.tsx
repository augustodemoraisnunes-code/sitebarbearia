import { ImagePlus, Quote, Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import DangerForm from "@/components/admin/DangerForm";
import ImagePicker from "@/components/admin/ImagePicker";
import {
  removeGalleryItem,
  removeTestimonial,
  saveGalleryItem,
  saveTestimonial,
} from "@/lib/actions/gallery";
import { listGallery, listTestimonials } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = [
  { value: "corte", label: "Corte (portfólio)" },
  { value: "ambiente", label: "Ambiente" },
  { value: "barbeiro", label: "Barbeiro" },
];

const CATEGORY_LABEL = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.label])
) as Record<string, string>;

export default async function GalleryAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { err, ok } = getFlash(await searchParams);
  const gallery = listGallery();
  const testimonials = listTestimonials(false);

  return (
    <>
      <PageHeader
        title="Galeria e depoimentos"
        description="Adicione as fotos reais da barbearia, dos cortes e do ambiente, além das avaliações dos clientes."
      />

      <FlashMessages err={err} ok={ok} />

      {/* Adicionar imagem */}
      <form action={saveGalleryItem} className="rounded-lg border border-ink/8 bg-white p-6">
        <div className="flex items-center gap-2">
          <ImagePlus size={16} className="text-bronze-deep" />
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Adicionar imagem
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ImagePicker
            label="Arquivo da foto"
            name="image_url"
            hint="Envie a foto real do trabalho ou do ambiente (JPG, PNG, WebP ou AVIF)."
          />

          <div className="flex flex-col gap-4">
            <div>
              <label className="label !text-ink/60" htmlFor="g-title">
                Título
              </label>
              <input
                id="g-title"
                name="title"
                placeholder="Ex.: Low fade com acabamento na navalha"
                className="field field-light !py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label !text-ink/60" htmlFor="g-category">
                  Categoria
                </label>
                <select
                  id="g-category"
                  name="category"
                  defaultValue="corte"
                  className="field field-light !py-2.5 text-sm"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    name="is_featured"
                    className="h-4 w-4 accent-[#C6A164]"
                  />
                  Destaque
                </label>
              </div>
            </div>

            <div>
              <label className="label !text-ink/60" htmlFor="g-desc">
                Descrição
              </label>
              <input
                id="g-desc"
                name="description"
                placeholder="Opcional"
                className="field field-light !py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <button className="btn btn-bronze mt-5 !py-3">Salvar imagem</button>
      </form>

      {/* Lista de imagens */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
          Imagens cadastradas ({gallery.length})
        </h2>

        {gallery.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-ink/15 bg-white px-6 py-12 text-center">
            <p className="serif-title text-lg text-ink">
              Nenhuma foto cadastrada ainda
            </p>
            <p className="mt-2 text-sm text-ink/55">
              Envie as fotografias reais acima. Elas aparecem automaticamente no
              site.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {gallery.map((g) => (
              <div
                key={g.id}
                className="overflow-hidden rounded-lg border border-ink/8 bg-white"
              >
                <div className="relative aspect-[4/3] bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.image_url}
                    alt={g.title || "Imagem da galeria"}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-sm bg-ink/80 px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-bronze">
                    {CATEGORY_LABEL[g.category] ?? g.category}
                  </span>
                  {g.is_featured && (
                    <span className="absolute right-2 top-2 rounded-sm bg-bronze px-2 py-1 text-[0.52rem] font-bold uppercase tracking-[0.12em] text-ink">
                      Destaque
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <p className="truncate text-sm font-semibold text-ink">
                    {g.title || "Sem título"}
                  </p>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-[0.62rem] font-bold uppercase tracking-[0.12em] text-bronze-deep">
                      Editar
                    </summary>
                    <form action={saveGalleryItem} className="mt-3 flex flex-col gap-3">
                      <input type="hidden" name="id" value={g.id} />
                      <input
                        name="title"
                        defaultValue={g.title}
                        placeholder="Título"
                        className="field field-light !py-2 text-xs"
                      />
                      <select
                        name="category"
                        defaultValue={g.category}
                        className="field field-light !py-2 text-xs"
                      >
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        name="image_url"
                        defaultValue={g.image_url}
                        placeholder="URL da imagem"
                        className="field field-light !py-2 text-xs"
                      />
                      <label className="flex items-center gap-2 text-xs text-ink/70">
                        <input
                          type="checkbox"
                          name="is_featured"
                          defaultChecked={g.is_featured}
                          className="h-3.5 w-3.5 accent-[#C6A164]"
                        />
                        Destaque
                      </label>
                      <button className="btn btn-bronze !py-2.5 !text-[0.6rem]">
                        Salvar
                      </button>
                    </form>
                  </details>

                  <DangerForm
                    action={removeGalleryItem}
                    confirmMessage="Remover esta imagem da galeria?"
                    className="mt-3"
                  >
                    <input type="hidden" name="id" value={g.id} />
                    <button className="flex w-full items-center justify-center gap-2 rounded-md border border-ink/15 px-3 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/60 hover:border-red-400 hover:text-red-600">
                      <Trash2 size={13} /> Remover
                    </button>
                  </DangerForm>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Depoimentos */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-ink/8 bg-white p-6">
          <div className="flex items-center gap-2">
            <Quote size={16} className="text-bronze-deep" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
              Novo depoimento
            </h2>
          </div>

          <form action={saveTestimonial} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="label !text-ink/60" htmlFor="t-name">
                Nome do cliente
              </label>
              <input
                id="t-name"
                name="client_name"
                className="field field-light !py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="label !text-ink/60" htmlFor="t-content">
                Comentário
              </label>
              <textarea
                id="t-content"
                name="content"
                className="field field-light min-h-24 resize-y text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label !text-ink/60" htmlFor="t-rating">
                  Avaliação (1–5)
                </label>
                <input
                  id="t-rating"
                  type="number"
                  name="rating"
                  min={1}
                  max={5}
                  defaultValue={5}
                  className="field field-light !py-2.5 text-sm"
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-ink/70">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked
                  className="h-4 w-4 accent-[#C6A164]"
                />
                Visível no site
              </label>
            </div>
            <button className="btn btn-bronze !py-3">Salvar depoimento</button>
          </form>
        </div>

        <div className="rounded-lg border border-ink/8 bg-white p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Depoimentos ({testimonials.length})
          </h2>

          <ul className="mt-5 flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1">
            {testimonials.map((t) => (
              <li key={t.id} className="rounded-md border border-ink/8 bg-cream/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-bold text-ink">
                      {t.client_name}
                    </span>
                    <span className="text-xs text-bronze-deep">
                      {"★".repeat(t.rating)}
                      <span className="text-ink/25">{"★".repeat(5 - t.rating)}</span>
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.55rem] font-bold uppercase ${
                      t.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {t.is_active ? "Visível" : "Oculto"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-ink/65">{t.content}</p>

                <div className="mt-3 flex gap-3">
                  <form action={saveTestimonial}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="client_name" value={t.client_name} />
                    <input type="hidden" name="content" value={t.content} />
                    <input type="hidden" name="rating" value={t.rating} />
                    <input type="hidden" name="image_url" value={t.image_url} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={t.is_active ? "" : "on"}
                    />
                    <button className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-bronze-deep hover:text-ink">
                      {t.is_active ? "Ocultar" : "Exibir"}
                    </button>
                  </form>

                  <DangerForm
                    action={removeTestimonial}
                    confirmMessage="Excluir este depoimento?"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <button className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/50 hover:text-red-600">
                      <Trash2 size={12} /> Excluir
                    </button>
                  </DangerForm>
                </div>
              </li>
            ))}
            {testimonials.length === 0 && (
              <li className="text-sm text-ink/55">
                Nenhum depoimento cadastrado.
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  );
}
