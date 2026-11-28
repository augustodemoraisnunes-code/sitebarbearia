// Controlador de persistência em produção.
//
// No Netlify o sistema de arquivos é somente-escrita e efêmero, então o
// SQLite roda em memória e o estado completo é sincronizado com o Netlify
// Blobs (armazenamento nativo, persistente entre deploys e instâncias).
//
// Toda mutação passa por `runMutation`, que:
//   1. recarrega o estado mais recente gravado (leitura forte);
//   2. executa a mutação localmente;
//   3. grava com trava otimista (`onlyIfMatch` no ETag) — se outra instância
//      gravou entre os passos 1 e 3, recarrega e executa a mutação de novo.
//
// Assim nunca se perde uma gravação e a validação de horários do agendamento
// continua correta mesmo com requisições simultâneas em instâncias distintas.
//
// Em desenvolvimento local (banco em arquivo) `runMutation` apenas executa a
// função: o SQLite local já serializa as escritas.
//
// Disponibilidade: toda operação no Blobs tem tempo máximo (`withTimeout`).
// Se uma leitura falha, o estado remoto fica desconhecido — as gravações são
// suspensas para não sobrescrever dados remotos com uma cópia local incompleta,
// e a recuperação acontece automaticamente na tentativa seguinte. Nenhuma
// falha do Blobs é propagada para a renderização de páginas.
import { getDb, isCloudPersistence } from "@/lib/db";
import { applySnapshot, dumpSnapshot, type DatabaseSnapshot } from "@/lib/storage/snapshot";
import { getDatabaseStore, DATABASE_KEY } from "@/lib/storage/blobs";

/** Janela em que leituras repetidas reaproveitam a última sincronização. */
const SYNC_TTL_MS = 1_000;
/** Tentativas de gravação com trava antes de recorrer à gravação direta. */
const MAX_WRITE_ATTEMPTS = 4;
/** Espera máxima de uma operação no Blobs antes de degradar para memória. */
const BLOBS_TIMEOUT_MS = 8_000;
/** Intervalo mínimo entre tentativas de (re)carregar o snapshot. */
const RELOAD_COOLDOWN_MS = 5_000;

type StorageState = {
  initialized: boolean;
  available: boolean;
  etag: string | null;
  lastSync: number;
  queue: Promise<unknown>;
};

const GLOBAL_KEY = "__barbearia_storage_state__";

let degradeWarned = false;

/**
 * Registra (uma única vez) que a persistência em nuvem não está ativa.
 * Só faz sentido quando o modo nuvem foi solicitado — em desenvolvimento
 * local o banco em arquivo já é persistente e nenhum aviso é emitido.
 */
function warnDegraded(): void {
  if (degradeWarned) return;
  degradeWarned = true;
  console.error(
    "[barbearia] Persistência no Netlify Blobs indisponível: os dados " +
      "(sessões de login, agendamentos e alterações do painel) viverão " +
      "apenas na memória desta instância e não sobreviverão a reinicializações."
  );
}

function state(): StorageState {
  const g = globalThis as Record<string, unknown>;
  const existing = g[GLOBAL_KEY] as StorageState | undefined;
  if (existing) return existing;
  const fresh: StorageState = {
    initialized: false,
    available: false,
    etag: null,
    lastSync: 0,
    queue: Promise.resolve(),
  };
  g[GLOBAL_KEY] = fresh;
  return fresh;
}

/** Serializa as operações de storage dentro desta instância. */
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const s = state();
  const next = s.queue.then(fn, fn);
  s.queue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

/**
 * Limita o tempo de uma operação no Blobs.
 *
 * Garante que nenhuma chamada de rede possa prender `ensureStorage()` (SSR,
 * generateMetadata) ou `runMutation` (login, agendamentos) para sempre. Os
 * handlers ficam anexados ao `op` mesmo quando o tempo vence a corrida, então
 * nenhuma rejeição fica sem tratamento.
 */
function withTimeout<T>(op: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`operação no Netlify Blobs excedeu ${BLOBS_TIMEOUT_MS}ms`)),
      BLOBS_TIMEOUT_MS
    );
    op.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Carrega (uma vez) e, em seguida, revalida o snapshot com o Blobs. */
async function refreshLocked(force: boolean): Promise<void> {
  const s = state();
  const db = getDb();

  // Estado ainda não carregado (primeira vez) ou recuperação após falha:
  // (re)tentar ler o snapshot respeitando um intervalo mínimo, para não somar
  // atraso em toda requisição. Mutações (`force`) pulam o intervalo, porque
  // ali é a última chance de persistir a alteração com estado atualizado.
  if (!s.initialized || !s.available) {
    if (!force && Date.now() - s.lastSync < RELOAD_COOLDOWN_MS) return;

    const store = await getDatabaseStore();
    if (!store) {
      // Sem Blobs neste ambiente: segue apenas com o banco em memória.
      s.available = false;
      s.initialized = true;
      s.lastSync = Date.now();
      warnDegraded();
      return;
    }
    try {
      const entry = await withTimeout(
        store.getWithMetadata(DATABASE_KEY, {
          type: "json",
          consistency: "strong",
        })
      );
      if (entry && entry.data) {
        applySnapshot(db, entry.data as DatabaseSnapshot);
        s.etag = entry.etag ?? null;
      }
      // Sem snapshot (primeira execução): mantém o seed padrão.
      s.initialized = true;
      s.available = true; // estado remoto lido: gravações reativadas
      s.lastSync = Date.now();
    } catch (err) {
      // Leitura falhou: o estado remoto é desconhecido, então as gravações
      // ficam suspensas (evita sobrescrever dados remotos com uma cópia
      // incompleta) e a próxima tentativa ocorre após o intervalo.
      console.error("[barbearia] Falha ao carregar dados do Netlify Blobs:", err);
      s.available = false;
      s.lastSync = Date.now();
    }
    return;
  }

  if (!force && Date.now() - s.lastSync < SYNC_TTL_MS) return;

  const store = await getDatabaseStore();
  if (!store) {
    s.available = false;
    s.lastSync = Date.now();
    warnDegraded();
    return;
  }

  try {
    const entry = await withTimeout(
      store.getWithMetadata(
        DATABASE_KEY,
        s.etag
          ? { type: "json", etag: s.etag, consistency: "strong" }
          : { type: "json", consistency: "strong" }
      )
    );
    if (!entry) {
      // O snapshot sumiu (ex.: store apagada): volta ao seed na próxima.
      s.etag = null;
      s.lastSync = Date.now();
      return;
    }
    if (entry.data === null || entry.data === undefined) {
      // ETag igual ao cache: nada mudou desde a última sincronização.
      s.lastSync = Date.now();
      return;
    }
    applySnapshot(db, entry.data as DatabaseSnapshot);
    s.etag = entry.etag ?? s.etag;
    s.lastSync = Date.now();
  } catch (err) {
    // Falha na leitura: suspende gravações até uma leitura bem-sucedida
    // (mesma recuperação do bloco anterior) e evita retry em loop.
    console.error("[barbearia] Falha ao sincronizar com o Netlify Blobs:", err);
    s.available = false;
    s.lastSync = Date.now();
  }
}

/**
 * Grava o estado atual. Retorna false quando outra instância gravou primeiro
 * (conflito de ETag) — o chamador deve recarregar e reexecutar a mutação.
 */
async function persistLocked(): Promise<boolean> {
  const s = state();
  if (!s.available) {
    warnDegraded();
    return true; // modo degradado: sem backend para persistir
  }
  const store = await getDatabaseStore();
  if (!store) {
    s.available = false;
    warnDegraded();
    return true;
  }

  const snapshot = dumpSnapshot(getDb());
  try {
    const result = s.etag
      ? await withTimeout(store.setJSON(DATABASE_KEY, snapshot, { onlyIfMatch: s.etag }))
      : await withTimeout(store.setJSON(DATABASE_KEY, snapshot, { onlyIfNew: true }));
    if (result.modified) {
      s.etag = result.etag ?? s.etag;
      s.lastSync = Date.now();
      return true;
    }
    return false;
  } catch (err) {
    throw new Error(
      `[barbearia] Falha ao gravar dados no Netlify Blobs: ${
        err instanceof Error ? err.message : err
      }`
    );
  }
}

/** Gravação irrestrita, usada apenas como último recurso após conflitos. */
async function persistUnconditionalLocked(): Promise<void> {
  const s = state();
  if (!s.available) return;
  const store = await getDatabaseStore();
  if (!store) {
    s.available = false;
    warnDegraded();
    return;
  }
  try {
    const result = await withTimeout(store.setJSON(DATABASE_KEY, dumpSnapshot(getDb())));
    if (result.modified) {
      s.etag = result.etag ?? s.etag;
      s.lastSync = Date.now();
    }
  } catch (err) {
    console.error("[barbearia] Falha na gravação final do snapshot:", err);
  }
}

/**
 * Garante que o banco esteja carregado antes de qualquer leitura (SSR,
 * generateMetadata, APIs). Nunca lança erro: em ambiente sem Blobs apenas
 * usa o estado em memória.
 */
export async function ensureStorage(): Promise<void> {
  if (!isCloudPersistence()) {
    getDb();
    return;
  }
  await withLock(() => refreshLocked(false));
}

/**
 * Marca a cópia local como desatualizada para que a próxima leitura force a
 * sincronização com o Blobs. Usado após login, quando a sessão acabou de ser
 * gravada e pode ter ido para outra instância.
 */
export function invalidateStorage(): void {
  state().lastSync = 0;
}

/**
 * Executa uma mutação de forma segura em produção (ver doc no topo).
 * Em desenvolvimento local apenas executa a função sobre o SQLite em disco.
 */
export async function runMutation<T>(fn: () => T): Promise<T> {
  if (!isCloudPersistence()) {
    getDb();
    return fn();
  }

  return withLock(async () => {
    await refreshLocked(true);

    let lastResult: T | undefined;
    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
      if (attempt > 0) await refreshLocked(true); // conflito: estado remoto novo
      const result = fn(); // validação/navegação lançam aqui, antes de gravar
      const persisted = await persistLocked();
      if (persisted) return result;
      lastResult = result;
    }

    // Conflitos repetidos: grava por cima para nunca perder esta mutação.
    await persistUnconditionalLocked();
    return lastResult as T;
  });
}
