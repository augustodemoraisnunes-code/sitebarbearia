"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";

type Props = {
  label?: string;
  name?: string;
  initialUrl?: string;
  hint?: string;
};

/**
 * Campo de imagem do painel: permite colar uma URL ou enviar um arquivo
 * (guardado em /public/uploads). O valor final vai no input hidden `name`.
 */
export default function ImagePicker({
  label = "Imagem",
  name = "image_url",
  initialUrl = "",
  hint = "Envie um arquivo ou cole a URL de uma imagem.",
}: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload.");
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-ink/10 bg-cream">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={22} className="text-ink/35" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn btn-ghost-dark !py-2.5 !text-[0.65rem]"
            >
              {uploading ? (
                <Loader2 size={14} className="spin" />
              ) : (
                <Upload size={14} />
              )}
              Enviar arquivo
            </button>
            <a
              href={url || "#"}
              target={url ? "_blank" : undefined}
              rel="noopener noreferrer"
              className={`btn btn-ghost-dark !py-2.5 !text-[0.65rem] ${url ? "" : "pointer-events-none opacity-40"}`}
            >
              Ver imagem
            </a>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… ou /uploads/arquivo.jpg"
            className="field field-light mt-3 !py-2.5 text-sm"
          />

          <p className="mt-2 text-xs text-ink/50">{hint}</p>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
