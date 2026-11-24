export type Service = {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

export type Client = {
  id: number;
  name: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: number;
  client_id: number | null;
  service_id: number | null;
  client_name_snapshot: string;
  client_phone_snapshot: string;
  service_name_snapshot: string;
  service_price_snapshot: number;
  service_duration_snapshot: number;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  status: AppointmentStatus;
  notes: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export type BusinessHour = {
  id: number;
  weekday: number; // 0 = domingo
  is_open: boolean;
  opening_time: string;
  closing_time: string;
};

export type BusinessBreak = {
  id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  description: string;
};

export type BlockedSlot = {
  id: number;
  start_datetime: string; // YYYY-MM-DDTHH:MM
  end_datetime: string;
  reason: string;
  created_at: string;
};

export type GalleryItem = {
  id: number;
  image_url: string;
  title: string;
  category: string; // corte | ambiente
  description: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
};

export type Testimonial = {
  id: number;
  client_name: string;
  content: string;
  rating: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
};

export type Profile = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

/** Status que ocupam horário na agenda. */
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
];
