// Serialização do banco SQLite para JSON.
//
// Usado para persistir o estado completo no Netlify Blobs (produção) e
// recarregá-lo quando uma instância fria atende uma requisição. A leitura é
// genérica: descobre tabelas e colunas pelo próprio esquema, então mudanças
// futuras no esquema continuam funcionando sem alterar este arquivo.
import type { DatabaseSync } from "node:sqlite";

export type TableSnapshot = {
  columns: string[];
  rows: unknown[][];
};

export type DatabaseSnapshot = {
  version: 1;
  saved_at: string;
  tables: Record<string, TableSnapshot>;
};

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function quote(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Lê todas as tabelas do banco em memória. */
export function dumpSnapshot(db: DatabaseSync): DatabaseSnapshot {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all() as Array<{ name: string }>;

  const out: Record<string, TableSnapshot> = {};
  for (const { name } of tables) {
    if (!IDENTIFIER.test(name)) continue;
    const info = db.prepare(`PRAGMA table_info(${quote(name)})`).all() as Array<{
      name: string;
    }>;
    const columns = info.map((c) => c.name);
    const rows = db.prepare(`SELECT * FROM ${quote(name)}`).all() as Array<
      Record<string, unknown>
    >;
    out[name] = {
      columns,
      rows: rows.map((row) => columns.map((col) => row[col] ?? null)),
    };
  }

  return { version: 1, saved_at: new Date().toISOString(), tables: out };
}

/**
 * Substitui integralmente o conteúdo do banco pelo snapshot recebido.
 * As FKs são desligadas durante a troca para permitir qualquer ordem de
 * inserção; sqlite_sequence é atualizado automaticamente pelos INSERTs.
 */
export function applySnapshot(db: DatabaseSync, snapshot: DatabaseSnapshot): boolean {
  if (!snapshot || snapshot.version !== 1 || !snapshot.tables) return false;

  db.exec("PRAGMA foreign_keys = OFF");
  let started = false;
  try {
    db.exec("BEGIN");
    started = true;
  } catch {
    started = false; // já havia transação aberta: aplica sem envelopar
  }

  try {
    for (const [table, data] of Object.entries(snapshot.tables)) {
      if (!IDENTIFIER.test(table)) continue;
      const exists = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get(table);
      if (!exists) continue;

      db.prepare(`DELETE FROM ${quote(table)}`).run();
      const columns = data.columns ?? [];
      if (columns.length === 0 || !data.rows || data.rows.length === 0) continue;

      const insert = db.prepare(
        `INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${columns
          .map(() => "?")
          .join(", ")})`
      );
      for (const row of data.rows) {
        insert.run(...(row as never[]));
      }
    }
    if (started) db.exec("COMMIT");
  } catch (err) {
    if (started) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* já revertido */
      }
    }
    throw err;
  } finally {
    db.exec("PRAGMA foreign_keys = ON");
  }

  return true;
}
