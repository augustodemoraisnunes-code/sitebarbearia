// Camada de acesso a dados. Toda leitura/escrita do sistema passa por aqui.
import { getDb } from "@/lib/db";
import type {
  Appointment,
  AppointmentStatus,
  BlockedSlot,
  BusinessBreak,
  BusinessHour,
  Client,
  GalleryItem,
  Profile,
  Service,
  Testimonial,
} from "@/lib/types";

type Row = Record<string, unknown>;

const bool = (v: unknown) => v === 1 || v === true;

function mapService(r: Row): Service {
  return {
    id: Number(r.id),
    name: String(r.name),
    description: String(r.description ?? ""),
    price: Number(r.price),
    duration_minutes: Number(r.duration_minutes),
    image_url: String(r.image_url ?? ""),
    is_active: bool(r.is_active),
    sort_order: Number(r.sort_order ?? 0),
  };
}

function mapAppointment(r: Row): Appointment {
  return {
    id: Number(r.id),
    client_id: r.client_id == null ? null : Number(r.client_id),
    service_id: r.service_id == null ? null : Number(r.service_id),
    client_name_snapshot: String(r.client_name_snapshot),
    client_phone_snapshot: String(r.client_phone_snapshot),
    service_name_snapshot: String(r.service_name_snapshot),
    service_price_snapshot: Number(r.service_price_snapshot),
    service_duration_snapshot: Number(r.service_duration_snapshot),
    appointment_date: String(r.appointment_date),
    start_time: String(r.start_time),
    end_time: String(r.end_time),
    status: String(r.status) as AppointmentStatus,
    notes: String(r.notes ?? ""),
    source: String(r.source ?? "site"),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

/* ------------------------------------------------------------------ */
/* Serviços                                                            */
/* ------------------------------------------------------------------ */

export function listServices(includeInactive = false): Service[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM services ${includeInactive ? "" : "WHERE is_active = 1"}
       ORDER BY sort_order ASC, id ASC`
    )
    .all() as Row[];
  return rows.map(mapService);
}

export function getService(id: number): Service | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as
    | Row
    | undefined;
  return row ? mapService(row) : null;
}

export function createService(data: Partial<Service>): Service {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO services (name, description, price, duration_minutes, image_url, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.name ?? "Novo serviço",
      data.description ?? "",
      data.price ?? 0,
      data.duration_minutes ?? 30,
      data.image_url ?? "",
      data.is_active === false ? 0 : 1,
      data.sort_order ?? 0
    );
  return getService(Number(info.lastInsertRowid))!;
}

export function updateService(id: number, data: Partial<Service>): Service | null {
  const db = getDb();
  const current = getService(id);
  if (!current) return null;
  db.prepare(
    `UPDATE services SET name = ?, description = ?, price = ?, duration_minutes = ?,
       image_url = ?, is_active = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    data.name ?? current.name,
    data.description ?? current.description,
    data.price ?? current.price,
    data.duration_minutes ?? current.duration_minutes,
    data.image_url ?? current.image_url,
    (data.is_active ?? current.is_active) ? 1 : 0,
    data.sort_order ?? current.sort_order,
    id
  );
  return getService(id);
}

export function deleteService(id: number): void {
  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
}

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

function mapClient(r: Row): Client {
  return {
    id: Number(r.id),
    name: String(r.name),
    phone: String(r.phone),
    notes: String(r.notes ?? ""),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

export function listClients(search = ""): Client[] {
  const db = getDb();
  const term = search.trim();
  const rows = (
    term
      ? db
          .prepare(
            `SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ?
             ORDER BY updated_at DESC`
          )
          .all(`%${term}%`, `%${term}%`)
      : db.prepare("SELECT * FROM clients ORDER BY updated_at DESC").all()
  ) as Row[];
  return rows.map(mapClient);
}

export function getClient(id: number): Client | null {
  const row = getDb().prepare("SELECT * FROM clients WHERE id = ?").get(id) as
    | Row
    | undefined;
  return row ? mapClient(row) : null;
}

export function upsertClient(name: string, phone: string): Client {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM clients WHERE phone = ?")
    .get(phone) as Row | undefined;
  if (existing) {
    db.prepare(
      "UPDATE clients SET name = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(name, Number(existing.id));
    return getClient(Number(existing.id))!;
  }
  const info = db
    .prepare("INSERT INTO clients (name, phone) VALUES (?, ?)")
    .run(name, phone);
  return getClient(Number(info.lastInsertRowid))!;
}

export function updateClient(
  id: number,
  data: Partial<Pick<Client, "name" | "phone" | "notes">>
): void {
  const db = getDb();
  const current = getClient(id);
  if (!current) return;
  db.prepare(
    "UPDATE clients SET name = ?, phone = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(
    data.name ?? current.name,
    data.phone ?? current.phone,
    data.notes ?? current.notes,
    id
  );
}

export function deleteClient(id: number): void {
  getDb().prepare("DELETE FROM clients WHERE id = ?").run(id);
}

/* ------------------------------------------------------------------ */
/* Agendamentos                                                        */
/* ------------------------------------------------------------------ */

export function listAppointments(opts: {
  from?: string;
  to?: string;
  status?: AppointmentStatus;
  limit?: number;
} = {}): Appointment[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (opts.from) {
    clauses.push("appointment_date >= ?");
    params.push(opts.from);
  }
  if (opts.to) {
    clauses.push("appointment_date <= ?");
    params.push(opts.to);
  }
  if (opts.status) {
    clauses.push("status = ?");
    params.push(opts.status);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = opts.limit ? `LIMIT ${Number(opts.limit)}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM appointments ${where}
       ORDER BY appointment_date ASC, start_time ASC ${limit}`
    )
    .all(...params) as Row[];
  return rows.map(mapAppointment);
}

export function getAppointment(id: number): Appointment | null {
  const row = getDb()
    .prepare("SELECT * FROM appointments WHERE id = ?")
    .get(id) as Row | undefined;
  return row ? mapAppointment(row) : null;
}

export function listAppointmentsByDate(date: string): Appointment[] {
  return listAppointments({ from: date, to: date }).filter(
    (a) => a.status !== "cancelled"
  );
}

/** Agendamentos que ocupam horário (pendentes e confirmados). */
export function listBlockingAppointments(date: string): Appointment[] {
  return listAppointments({ from: date, to: date }).filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );
}

export type NewAppointmentInput = {
  client_id: number | null;
  service_id: number | null;
  client_name: string;
  client_phone: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  date: string;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  notes?: string;
  source?: string;
};

export function insertAppointment(input: NewAppointmentInput): Appointment {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO appointments (
        client_id, service_id, client_name_snapshot, client_phone_snapshot,
        service_name_snapshot, service_price_snapshot, service_duration_snapshot,
        appointment_date, start_time, end_time, status, notes, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.client_id,
      input.service_id,
      input.client_name,
      input.client_phone,
      input.service_name,
      input.service_price,
      input.service_duration,
      input.date,
      input.start_time,
      input.end_time,
      input.status ?? "pending",
      input.notes ?? "",
      input.source ?? "site"
    );
  return getAppointment(Number(info.lastInsertRowid))!;
}

export function updateAppointmentStatus(
  id: number,
  status: AppointmentStatus
): Appointment | null {
  getDb()
    .prepare(
      "UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?"
    )
    .run(status, id);
  return getAppointment(id);
}

export function updateAppointment(
  id: number,
  data: Partial<
    Pick<
      NewAppointmentInput,
      | "client_name"
      | "client_phone"
      | "service_name"
      | "service_price"
      | "service_duration"
      | "date"
      | "start_time"
      | "end_time"
      | "status"
      | "notes"
    >
  >
): Appointment | null {
  const db = getDb();
  const current = getAppointment(id);
  if (!current) return null;
  db.prepare(
    `UPDATE appointments SET
       client_name_snapshot = ?, client_phone_snapshot = ?,
       service_name_snapshot = ?, service_price_snapshot = ?, service_duration_snapshot = ?,
       appointment_date = ?, start_time = ?, end_time = ?,
       status = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    data.client_name ?? current.client_name_snapshot,
    data.client_phone ?? current.client_phone_snapshot,
    data.service_name ?? current.service_name_snapshot,
    data.service_price ?? current.service_price_snapshot,
    data.service_duration ?? current.service_duration_snapshot,
    data.date ?? current.appointment_date,
    data.start_time ?? current.start_time,
    data.end_time ?? current.end_time,
    data.status ?? current.status,
    data.notes ?? current.notes,
    id
  );
  return getAppointment(id);
}

export function deleteAppointment(id: number): void {
  getDb().prepare("DELETE FROM appointments WHERE id = ?").run(id);
}

export function clientAppointmentHistory(phone: string): Appointment[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM appointments WHERE client_phone_snapshot = ?
       ORDER BY appointment_date DESC, start_time DESC`
    )
    .all(phone) as Row[];
  return rows.map(mapAppointment);
}

/* ------------------------------------------------------------------ */
/* Expediente, pausas e bloqueios                                      */
/* ------------------------------------------------------------------ */

function mapHour(r: Row): BusinessHour {
  return {
    id: Number(r.id),
    weekday: Number(r.weekday),
    is_open: bool(r.is_open),
    opening_time: String(r.opening_time),
    closing_time: String(r.closing_time),
  };
}

export function listBusinessHours(): BusinessHour[] {
  const rows = getDb()
    .prepare("SELECT * FROM business_hours ORDER BY weekday ASC")
    .all() as Row[];
  return rows.map(mapHour);
}

export function updateBusinessHour(
  weekday: number,
  data: { is_open: boolean; opening_time: string; closing_time: string }
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO business_hours (weekday, is_open, opening_time, closing_time)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(weekday) DO UPDATE SET
       is_open = excluded.is_open,
       opening_time = excluded.opening_time,
       closing_time = excluded.closing_time`
  ).run(weekday, data.is_open ? 1 : 0, data.opening_time, data.closing_time);
}

function mapBreak(r: Row): BusinessBreak {
  return {
    id: Number(r.id),
    weekday: Number(r.weekday),
    start_time: String(r.start_time),
    end_time: String(r.end_time),
    description: String(r.description ?? ""),
  };
}

export function listBreaks(): BusinessBreak[] {
  const rows = getDb()
    .prepare("SELECT * FROM business_breaks ORDER BY weekday ASC, start_time ASC")
    .all() as Row[];
  return rows.map(mapBreak);
}

export function addBreak(data: Omit<BusinessBreak, "id">): void {
  getDb()
    .prepare(
      "INSERT INTO business_breaks (weekday, start_time, end_time, description) VALUES (?, ?, ?, ?)"
    )
    .run(data.weekday, data.start_time, data.end_time, data.description);
}

export function deleteBreak(id: number): void {
  getDb().prepare("DELETE FROM business_breaks WHERE id = ?").run(id);
}

function mapBlock(r: Row): BlockedSlot {
  return {
    id: Number(r.id),
    start_datetime: String(r.start_datetime),
    end_datetime: String(r.end_datetime),
    reason: String(r.reason ?? ""),
    created_at: String(r.created_at),
  };
}

export function listBlocks(): BlockedSlot[] {
  const rows = getDb()
    .prepare("SELECT * FROM blocked_slots ORDER BY start_datetime ASC")
    .all() as Row[];
  return rows.map(mapBlock);
}

export function addBlock(data: Omit<BlockedSlot, "id" | "created_at">): BlockedSlot {
  const info = getDb()
    .prepare(
      "INSERT INTO blocked_slots (start_datetime, end_datetime, reason) VALUES (?, ?, ?)"
    )
    .run(data.start_datetime, data.end_datetime, data.reason);
  const row = getDb()
    .prepare("SELECT * FROM blocked_slots WHERE id = ?")
    .get(Number(info.lastInsertRowid)) as Row;
  return mapBlock(row);
}

export function deleteBlock(id: number): void {
  getDb().prepare("DELETE FROM blocked_slots WHERE id = ?").run(id);
}

/* ------------------------------------------------------------------ */
/* Galeria                                                             */
/* ------------------------------------------------------------------ */

function mapGallery(r: Row): GalleryItem {
  return {
    id: Number(r.id),
    image_url: String(r.image_url),
    title: String(r.title ?? ""),
    category: String(r.category ?? "corte"),
    description: String(r.description ?? ""),
    is_featured: bool(r.is_featured),
    sort_order: Number(r.sort_order ?? 0),
    created_at: String(r.created_at),
  };
}

export function listGallery(category?: string): GalleryItem[] {
  const db = getDb();
  const rows = (
    category
      ? db
          .prepare(
            "SELECT * FROM gallery WHERE category = ? ORDER BY sort_order ASC, id DESC"
          )
          .all(category)
      : db
          .prepare("SELECT * FROM gallery ORDER BY sort_order ASC, id DESC")
          .all()
  ) as Row[];
  return rows.map(mapGallery);
}

export function addGallery(
  data: Omit<GalleryItem, "id" | "created_at" | "sort_order"> & { sort_order?: number }
): GalleryItem {
  const info = getDb()
    .prepare(
      `INSERT INTO gallery (image_url, title, category, description, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.image_url,
      data.title,
      data.category,
      data.description,
      data.is_featured ? 1 : 0,
      data.sort_order ?? 0
    );
  const row = getDb()
    .prepare("SELECT * FROM gallery WHERE id = ?")
    .get(Number(info.lastInsertRowid)) as Row;
  return mapGallery(row);
}

export function updateGallery(
  id: number,
  data: Partial<Omit<GalleryItem, "id" | "created_at">>
): void {
  const db = getDb();
  const row = db.prepare("SELECT * FROM gallery WHERE id = ?").get(id) as
    | Row
    | undefined;
  if (!row) return;
  const current = mapGallery(row);
  db.prepare(
    `UPDATE gallery SET image_url = ?, title = ?, category = ?, description = ?,
       is_featured = ?, sort_order = ? WHERE id = ?`
  ).run(
    data.image_url ?? current.image_url,
    data.title ?? current.title,
    data.category ?? current.category,
    data.description ?? current.description,
    (data.is_featured ?? current.is_featured) ? 1 : 0,
    data.sort_order ?? current.sort_order,
    id
  );
}

export function deleteGallery(id: number): void {
  getDb().prepare("DELETE FROM gallery WHERE id = ?").run(id);
}

/* ------------------------------------------------------------------ */
/* Depoimentos                                                         */
/* ------------------------------------------------------------------ */

function mapTestimonial(r: Row): Testimonial {
  return {
    id: Number(r.id),
    client_name: String(r.client_name),
    content: String(r.content),
    rating: Number(r.rating ?? 5),
    image_url: String(r.image_url ?? ""),
    is_active: bool(r.is_active),
    created_at: String(r.created_at),
  };
}

export function listTestimonials(onlyActive = true): Testimonial[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM testimonials ${onlyActive ? "WHERE is_active = 1" : ""}
       ORDER BY id DESC`
    )
    .all() as Row[];
  return rows.map(mapTestimonial);
}

export function addTestimonial(
  data: Omit<Testimonial, "id" | "created_at">
): void {
  getDb()
    .prepare(
      `INSERT INTO testimonials (client_name, content, rating, image_url, is_active)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      data.client_name,
      data.content,
      data.rating,
      data.image_url,
      data.is_active ? 1 : 0
    );
}

export function updateTestimonial(
  id: number,
  data: Partial<Omit<Testimonial, "id" | "created_at">>
): void {
  const db = getDb();
  const row = db.prepare("SELECT * FROM testimonials WHERE id = ?").get(id) as
    | Row
    | undefined;
  if (!row) return;
  const current = mapTestimonial(row);
  db.prepare(
    "UPDATE testimonials SET client_name = ?, content = ?, rating = ?, image_url = ?, is_active = ? WHERE id = ?"
  ).run(
    data.client_name ?? current.client_name,
    data.content ?? current.content,
    data.rating ?? current.rating,
    data.image_url ?? current.image_url,
    (data.is_active ?? current.is_active) ? 1 : 0,
    id
  );
}

export function deleteTestimonial(id: number): void {
  getDb().prepare("DELETE FROM testimonials WHERE id = ?").run(id);
}

/* ------------------------------------------------------------------ */
/* Configurações                                                       */
/* ------------------------------------------------------------------ */

export function getSettings(): Record<string, string> {
  const rows = getDb()
    .prepare("SELECT key, value FROM settings")
    .all() as Row[];
  const out: Record<string, string> = {};
  rows.forEach((r) => (out[String(r.key)] = String(r.value)));
  return out;
}

export function getSetting(key: string): string {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as Row | undefined;
  return row ? String(row.value) : "";
}

export function setSettings(data: Record<string, string>): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  Object.entries(data).forEach(([k, v]) => stmt.run(k, String(v)));
}

export function numberSetting(key: string, fallback: number): number {
  const raw = getSetting(key);
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/* ------------------------------------------------------------------ */
/* Perfis e sessões                                                    */
/* ------------------------------------------------------------------ */

function mapProfile(r: Row): Profile {
  return {
    id: Number(r.id),
    name: String(r.name),
    email: String(r.email),
    role: String(r.role),
  };
}

export function getProfileByEmail(email: string): (Profile & { password_hash: string }) | null {
  const row = getDb()
    .prepare("SELECT * FROM profiles WHERE email = ?")
    .get(email.trim().toLowerCase()) as Row | undefined;
  if (!row) return null;
  return { ...mapProfile(row), password_hash: String(row.password_hash) };
}

export function getProfileById(id: number): Profile | null {
  const row = getDb().prepare("SELECT * FROM profiles WHERE id = ?").get(id) as
    | Row
    | undefined;
  return row ? mapProfile(row) : null;
}

export function updateProfilePassword(id: number, hash: string): void {
  getDb()
    .prepare("UPDATE profiles SET password_hash = ? WHERE id = ?")
    .run(hash, id);
}

export function updateProfileName(id: number, name: string): void {
  getDb().prepare("UPDATE profiles SET name = ? WHERE id = ?").run(name, id);
}

export function createSession(profileId: number, tokenHash: string, expiresAt: string): void {
  getDb()
    .prepare(
      "INSERT INTO sessions (token_hash, profile_id, expires_at) VALUES (?, ?, ?)"
    )
    .run(tokenHash, profileId, expiresAt);
}

export function getSessionProfile(tokenHash: string): Profile | null {
  const row = getDb()
    .prepare(
      `SELECT p.* FROM sessions s
       JOIN profiles p ON p.id = s.profile_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
    )
    .get(tokenHash) as Row | undefined;
  return row ? mapProfile(row) : null;
}

export function deleteSession(tokenHash: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function purgeExpiredSessions(): void {
  getDb().prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}
