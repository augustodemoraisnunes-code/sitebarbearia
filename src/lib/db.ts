// Conexão e esquema do banco de dados (SQLite via node:sqlite).
//
// Modos de operação, resolvidos em tempo de execução:
//
//   1. BARBEARIA_DB_PATH definido -> arquivo nesse caminho exato (dev ou
//      volume montado explicitamente).
//   2. Produção no Netlify -> banco EM MEMÓRIA, sem tocar no sistema de
//      arquivos. A persistência é feita pelo Netlify Blobs via src/lib/storage.
//      A detecção usa o CONTEXTO DO BLOBS injetado pela plataforma em runtime
//      (`globalThis.netlifyBlobsContext` / `NETLIFY_BLOBS_CONTEXT`), pois a
//      variável NETLIFY=true só existe no ambiente de BUILD do Netlify — ela
//      NÃO é definida no runtime das functions. Nenhuma variável de ambiente
//      é necessária para ativar a persistência em produção.
//   3. Padrão (desenvolvimento local) -> arquivo fora do projeto (para não
//      interferir no watch do Next.js), com fallback automático para o
//      diretório temporário e, em último caso, memória.
//
// Nenhum modo depende da existência de um diretório específico: falhas de
// criação do arquivo caem para o próximo candidato em vez de quebrar a
// renderização.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { hashPasswordSync } from "@/lib/password";

const GLOBAL_KEY = "__barbearia_db__" as const;

type GlobalWithDb = typeof globalThis & {
  [GLOBAL_KEY]?: DatabaseSync;
};

/**
 * Verdadeiro quando o contexto do Netlify Blobs está disponível neste
 * processo. É o MESMO mecanismo que o próprio `@netlify/blobs` usa para
 * descobrir `siteID`/`token` (ver `getEnvironmentContext` em
 * `node_modules/@netlify/blobs/dist/chunk-*.js`): injetado pela plataforma
 * em runtime (functions, edge, build plugins) sem exigir nenhuma configuração.
 *
 * A ordem de leitura espelha a da biblioteca: `globalThis.netlifyBlobsContext`
 * tem precedência sobre `NETLIFY_BLOBS_CONTEXT`, que por sua vez pode estar
 * em `globalThis.Netlify.env` (runtime moderno) ou em `process.env`.
 */
export function hasBlobsContext(): boolean {
  try {
    const g = globalThis as Record<string, unknown>;

    // 1. Contexto já decodificado no global (injetado pelo runtime).
    const inline = g.netlifyBlobsContext;
    if (typeof inline === "string" && inline.length > 0) return true;
    if (inline && typeof inline === "object") return true;

    // 2. `Netlify.env` (runtime-utils `getEnvironment()`) e, por fim,
    //    `process.env` — cobre build, functions e CLI.
    const netlifyEnv = (
      g.Netlify as { env?: { get?: (key: string) => string | undefined } } | undefined
    )?.env;
    if (netlifyEnv?.get?.("NETLIFY_BLOBS_CONTEXT")) return true;
    if (process.env.NETLIFY_BLOBS_CONTEXT) return true;
  } catch {
    /* ambiente sem acesso a globalThis/process */
  }
  return false;
}

/**
 * Verdadeiro quando os dados devem ser persistidos no Netlify Blobs
 * (produção no Netlify). Nesse modo nenhum arquivo é criado em disco.
 *
 * Ordem de detecção (nenhuma variável obrigatória):
 *   1. BARBEARIA_STORAGE=file|memory|blobs -> override explícito;
 *   2. contexto do Blobs presente -> runtime do Netlify (functions);
 *   3. NETLIFY=true -> apenas no build do Netlify (banco em memória para o
 *      prerender, sem criar diretórios).
 */
export function isCloudPersistence(): boolean {
  const mode = process.env.BARBEARIA_STORAGE;
  if (mode === "file" || mode === "memory") return false;
  if (mode === "blobs") return true;
  if (hasBlobsContext()) return true;
  return process.env.NETLIFY === "true";
}

/** Candidatos a arquivo de banco, do mais desejável ao fallback final. */
function fileCandidates(): string[] {
  const explicit = process.env.BARBEARIA_DB_PATH;
  if (explicit) return [explicit, ":memory:"];

  const candidates: string[] = [];
  try {
    candidates.push(path.join(os.homedir(), ".barbearia-premium", "barbearia.db"));
  } catch {
    /* sem diretório pessoal disponível */
  }
  try {
    candidates.push(path.join(os.tmpdir(), "barbearia-premium", "barbearia.db"));
  } catch {
    /* sem diretório temporário disponível */
  }
  candidates.push(":memory:");
  return candidates;
}

function open(): DatabaseSync {
  // Em produção no Netlify (ou com BARBEARIA_STORAGE=memory) nunca criamos
  // diretórios: o sistema de arquivos das functions é efêmero/somente-leitura.
  const memoryOnly =
    process.env.BARBEARIA_STORAGE === "memory" ||
    (isCloudPersistence() && !process.env.BARBEARIA_DB_PATH);
  const candidates = memoryOnly
    ? [":memory:"]
    : fileCandidates();

  let lastError: unknown;
  for (const target of candidates) {
    try {
      if (target !== ":memory:") {
        fs.mkdirSync(path.dirname(target), { recursive: true });
      }
      const db = new DatabaseSync(target);
      db.exec("PRAGMA journal_mode = WAL;");
      db.exec("PRAGMA foreign_keys = ON;");
      db.exec("PRAGMA busy_timeout = 5000;");
      migrate(db);
      seed(db);
      return db;
    } catch (err) {
      lastError = err;
      console.warn(
        `[barbearia] Banco indisponível em "${target}":`,
        err instanceof Error ? err.message : err
      );
    }
  }
  throw new Error(
    `[barbearia] Não foi possível inicializar o banco de dados: ${
      lastError instanceof Error ? lastError.message : lastError
    }`
  );
}

/** Carrega o snapshot persistido assim que o banco é aberto (melhor esforço). */
function scheduleCloudBootstrap(): void {
  if (!isCloudPersistence()) return;
  void import("@/lib/storage")
    .then((m) => m.ensureStorage())
    .catch(() => {
      /* degrada para o estado em memória */
    });
}

export function getDb(): DatabaseSync {
  const g = globalThis as GlobalWithDb;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = open();
    scheduleCloudBootstrap();
  }
  return g[GLOBAL_KEY]!;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT NOT NULL UNIQUE,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      image_url TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
      client_name_snapshot TEXT NOT NULL,
      client_phone_snapshot TEXT NOT NULL,
      service_name_snapshot TEXT NOT NULL,
      service_price_snapshot REAL NOT NULL,
      service_duration_snapshot INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'site',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments(status);

    CREATE TABLE IF NOT EXISTS business_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekday INTEGER NOT NULL UNIQUE,
      is_open INTEGER NOT NULL DEFAULT 1,
      opening_time TEXT NOT NULL DEFAULT '09:00',
      closing_time TEXT NOT NULL DEFAULT '19:00'
    );

    CREATE TABLE IF NOT EXISTS business_breaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekday INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'corte',
      description TEXT NOT NULL DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      image_url TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function seed(db: DatabaseSync) {
  const hasService = db.prepare("SELECT COUNT(*) AS c FROM services").get() as {
    c: number;
  };
  if (hasService.c === 0) {
    const insert = db.prepare(
      `INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, sort_order)
       VALUES (?, ?, ?, ?, '', 1, ?)`
    );
    const services: Array<[string, string, number, number]> = [
      ["Corte tradicional", "Corte clássico com acabamento preciso e acabamento na navalha.", 45, 40],
      ["Degradê / Fade", "Fade limpo nas laterais com transição suave e definição na nuca.", 50, 45],
      ["Corte + barba", "Experiência completa: corte personalizado, barba modelada e toalha quente.", 70, 60],
      ["Barba", "Barba desenhada, toalha quente, óleo e hidratação.", 35, 30],
      ["Acabamento", "Manutenção de contornos, nuca e laterais.", 25, 20],
      ["Sobrancelha", "Design de sobrancelha com acabamento natural.", 20, 15],
      ["Corte infantil", "Corte confortável e divertido para as crianças.", 40, 35],
    ];
    services.forEach((s, i) => insert.run(s[0], s[1], s[2], s[3], i));
  }

  const hasHours = db.prepare("SELECT COUNT(*) AS c FROM business_hours").get() as {
    c: number;
  };
  if (hasHours.c === 0) {
    const insert = db.prepare(
      "INSERT INTO business_hours (weekday, is_open, opening_time, closing_time) VALUES (?, ?, ?, ?)"
    );
    // 0 = domingo ... 6 = sábado
    const week: Array<[number, number, string, string]> = [
      [0, 0, "09:00", "19:00"], // domingo fechado
      [1, 1, "09:00", "19:00"],
      [2, 1, "09:00", "19:00"],
      [3, 1, "09:00", "19:00"],
      [4, 1, "09:00", "19:00"],
      [5, 1, "09:00", "19:00"],
      [6, 1, "09:00", "17:00"], // sábado
    ];
    week.forEach((w) => insert.run(w[0], w[1], w[2], w[3]));
  }

  const hasBreaks = db.prepare("SELECT COUNT(*) AS c FROM business_breaks").get() as {
    c: number;
  };
  if (hasBreaks.c === 0) {
    const insert = db.prepare(
      "INSERT INTO business_breaks (weekday, start_time, end_time, description) VALUES (?, ?, ?, ?)"
    );
    for (let d = 1; d <= 5; d++) insert.run(d, "12:00", "13:30", "Almoço");
  }

  const hasProfile = db.prepare("SELECT COUNT(*) AS c FROM profiles").get() as {
    c: number;
  };
  if (hasProfile.c === 0) {
    const email = process.env.BARBEARIA_ADMIN_EMAIL || "admin@casanavalha.com.br";
    const password = process.env.BARBEARIA_ADMIN_PASSWORD || "barbearia2026";
    db.prepare(
      "INSERT INTO profiles (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
    ).run("Administrador", email, hashPasswordSync(password));
  }

  const hasGallery = db.prepare("SELECT COUNT(*) AS c FROM gallery").get() as {
    c: number;
  };
  void hasGallery; // Galeria propositalmente vazia: as fotos reais são adicionadas pelo painel.

  const defaults: Record<string, string> = {
    business_name: "Casa Navalha",
    tagline: "Barbearia Premium",
    barber_name: "Alex Ferreira",
    barber_role: "Barbeiro e fundador",
    barber_bio:
      "Mais do que técnica, o trabalho envolve atenção aos detalhes, dedicação e entendimento do estilo de cada cliente. Cada corte é pensado para valorizar a personalidade, respeitando as preferências e buscando um resultado que faça diferença.",
    barber_years: "8",
    barber_specialties: "Degradê, cortes clássicos, barba modelada",
    hero_kicker: "ESTILO. PRECISÃO. PERSONALIDADE.",
    hero_title: "Seu estilo começa no detalhe.",
    hero_description:
      "Mais do que um corte, uma experiência feita para valorizar seu estilo e sua personalidade.",
    phone: "(11) 99999-9999",
    whatsapp: "5511999999999",
    instagram: "https://instagram.com/",
    address: "Rua das Palmeiras, 123 — São Paulo/SP",
    map_url:
      "https://www.google.com/maps?q=Rua+das+Palmeiras+123+Sao+Paulo&output=embed",
    schedule_display: "Seg a Sex 09:00–19:00 · Sáb 09:00–17:00 · Dom fechado",
    slot_interval_minutes: "15",
    buffer_minutes: "5",
    min_notice_minutes: "60",
    max_days_ahead: "60",
    hero_image: "",
    about_image: "",
    environment_cover: "",
  };
  const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );
  Object.entries(defaults).forEach(([k, v]) => insertSetting.run(k, v));
}
