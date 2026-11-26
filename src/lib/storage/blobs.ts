// Acesso ao Netlify Blobs com degradação segura.
//
// Em ambientes sem o contexto do Netlify (desenvolvimento local, build sem
// credenciais) as funções retornam null e o aplicativo continua funcionando
// apenas com o estado em memória — nenhuma exceção é propagada para a
// renderização de páginas ou para a geração de metadados.
import type { Store } from "@netlify/blobs";

/** Store dedicada ao snapshot do banco de dados. */
export const DATABASE_STORE = "barbearia-dados";
/** Chave do snapshot completo dentro da store. */
export const DATABASE_KEY = "banco-principal";
/** Store das imagens enviadas pelo painel administrativo. */
export const UPLOADS_STORE = "barbearia-uploads";

type BlobsModule = typeof import("@netlify/blobs");

let modulePromise: Promise<BlobsModule | null> | undefined;

function loadModule(): Promise<BlobsModule | null> {
  if (!modulePromise) {
    modulePromise = import("@netlify/blobs").catch(() => null);
  }
  return modulePromise;
}

/** Store do banco; null quando o ambiente não suporta Netlify Blobs. */
export async function getDatabaseStore(): Promise<Store | null> {
  const mod = await loadModule();
  if (!mod) return null;
  try {
    return mod.getStore({ name: DATABASE_STORE, consistency: "strong" });
  } catch {
    return null;
  }
}

/** Store das imagens enviadas pelo painel; null quando indisponível. */
export async function getUploadsStore(): Promise<Store | null> {
  const mod = await loadModule();
  if (!mod) return null;
  try {
    return mod.getStore({ name: UPLOADS_STORE, consistency: "strong" });
  } catch {
    return null;
  }
}
