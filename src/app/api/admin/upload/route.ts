import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentAdmin } from "@/lib/auth";
import { isCloudPersistence } from "@/lib/db";
import { getUploadsStore } from "@/lib/storage/blobs";

export const dynamic = "force-dynamic";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

/**
 * POST /api/admin/upload — recebe um arquivo de imagem e devolve a URL.
 *
 * Em produção (Netlify) a imagem vai para o Netlify Blobs — o sistema de
 * arquivos da função é efêmero e não serve como armazenamento. A URL
 * devolvida (/api/uploads/arquivo) é servida por esta mesma aplicação.
 * Em desenvolvimento local o arquivo é gravado em public/uploads, como antes.
 */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Formato não suportado. Use JPG, PNG, WebP ou AVIF." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Imagem muito grande (máximo 8 MB)." },
        { status: 400 }
      );
    }

    const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const buffer = await file.arrayBuffer();

    if (isCloudPersistence()) {
      const store = await getUploadsStore();
      if (!store) {
        return NextResponse.json(
          { error: "Armazenamento de imagens indisponível no momento." },
          { status: 503 }
        );
      }
      await store.set(filename, buffer, {
        metadata: { content_type: file.type },
      });
      return NextResponse.json({ url: `/api/uploads/${filename}` }, { status: 201 });
    }

    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), Buffer.from(buffer));

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (err) {
    console.error("Falha no upload:", err);
    return NextResponse.json(
      { error: "Não foi possível enviar a imagem." },
      { status: 500 }
    );
  }
}
