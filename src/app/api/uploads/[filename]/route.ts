import { getUploadsStore } from "@/lib/storage/blobs";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/** Apenas nomes gerados pelo upload: timestamp-hex.ext */
const SAFE_NAME = /^\d{13}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|avif|gif)$/i;

/**
 * GET /api/uploads/[filename] — serve imagens enviadas pelo painel.
 *
 * Em produção as imagens ficam no Netlify Blobs (armazenamento persistente);
 * em desenvolvimento local os arquivos estáticos de public/uploads são
 * servidos pelo próprio Next, então esta rota responde 404 por lá.
 */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ filename: string }> }
) {
  const { filename } = await ctx.params;
  if (!SAFE_NAME.test(filename)) {
    return new Response("Não encontrado", { status: 404 });
  }

  const store = await getUploadsStore();
  if (!store) {
    return new Response("Não encontrado", { status: 404 });
  }

  try {
    const data = await store.get(filename, {
      type: "arrayBuffer",
      consistency: "strong",
    });
    if (!data) {
      return new Response("Não encontrado", { status: 404 });
    }

    const ext = filename.split(".").pop()!.toLowerCase();
    return new Response(data, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Falha ao servir imagem:", err);
    return new Response("Não encontrado", { status: 404 });
  }
}
