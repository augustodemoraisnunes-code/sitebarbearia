// Acesso ao Netlify Blobs com degradação segura.
//
// Em ambientes sem o contexto do Netlify (desenvolvimento local, build sem
// credenciais) as funções retornam null e o aplicativo continua funcionando
// apenas com o estado em memória — nenhuma exceção é propagada para a
// renderização de páginas ou para a geração de metadados.
import type { Store } from "@netlify/blobs";
import { isCloudPersistence } from "@/lib/db";

/** Store dedicada ao snapshot do banco de dados. */
export const DATABASE_STORE = "barbearia-dados";
/** Chave do snapshot completo dentro da store. */
export const DATABASE_KEY = "banco-principal";
/** Store das imagens enviadas pelo painel administrativo. */
export const UPLOADS_STORE = "barbearia-uploads";

type BlobsModule = typeof import("@netlify/blobs");

let modulePromise: Promise<BlobsModule | null> | undefined;
let warned = false;

/**
 * `fetch` seguro para o `@netlify/blobs`.
 *
 * Dentro do runtime do Next.js, `Response.body.cancel()` (usado pela
 * biblioteca em `discardBody` para descartar respostas 404 e de erro) nunca
 * resolve: `getWithMetadata`/`set` ficavam pendurados para sempre e travavam
 * o SSR — a homepage deixava de responder e o login não completava.
 *
 * Aqui o corpo da resposta é lido uma única vez e a resposta é reconstruída
 * a partir do buffer. O `cancel()` de um stream já materializado resolve
 * imediatamente, então nenhuma chamada do Blobs pode travar a renderização.
 * (Respostas sem corpo, como 204/304, são repassadas como estão: nelas
 * `body` é null e o descarte da biblioteca já é um no-op.)
 */
/** Status que, pela especificação, nunca podem carregar corpo. */
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

const safeFetch: typeof globalThis.fetch = async (input, init) => {
  const res = await globalThis.fetch(input, init);
  // Sem corpo (ou status que não permite corpo): repassa como está — o
  // descarte da biblioteca já é um no-op e `json()`/`text()` não são usados.
  if (!res.body || NULL_BODY_STATUSES.has(res.status)) return res;
  const buffer = await res.arrayBuffer();
  return new Response(buffer, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
};

/**
 * Registra (uma única vez) que a persistência está degradada.
 *
 * Garantia de disponibilidade: nenhuma falha do Blobs é propagada para a
 * renderização — apenas é registrada, para que o operador saiba que os dados
 * viverão apenas na memória desta instância.
 */
function warnUnavailable(err: unknown): void {
  if (!isCloudPersistence() || warned) return;
  warned = true;
  console.error(
    "[barbearia] Netlify Blobs indisponível — persistência degradada para memória:",
    err instanceof Error ? err.message : err
  );
}

function loadModule(): Promise<BlobsModule | null> {
  if (!modulePromise) {
    modulePromise = import("@netlify/blobs").then(
      (m) => m,
      (err) => {
        warnUnavailable(err);
        return null;
      }
    );
  }
  return modulePromise;
}

/** Store do banco; null quando o ambiente não suporta Netlify Blobs. */
export async function getDatabaseStore(): Promise<Store | null> {
  const mod = await loadModule();
  if (!mod) return null;
  try {
    return mod.getStore({
      name: DATABASE_STORE,
      consistency: "strong",
      fetch: safeFetch,
    });
  } catch (err) {
    // Ausência de contexto (MissingBlobsEnvironmentError) ou erro de
    // configuração: degrada para memória em vez de quebrar a página.
    warnUnavailable(err);
    return null;
  }
}

/** Store das imagens enviadas pelo painel; null quando indisponível. */
export async function getUploadsStore(): Promise<Store | null> {
  const mod = await loadModule();
  if (!mod) return null;
  try {
    return mod.getStore({
      name: UPLOADS_STORE,
      consistency: "strong",
      fetch: safeFetch,
    });
  } catch (err) {
    warnUnavailable(err);
    return null;
  }
}
