import { NextResponse } from "next/server";
import {
  getService,
  listBusinessHours,
  listBreaks,
  listBlocks,
  listBlockingAppointments,
} from "@/lib/queries";
import {
  getAvailableSlots,
  monthAvailability,
} from "@/lib/booking/availability";
import { getBookingConfig } from "@/lib/booking";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability?date=YYYY-MM-DD&service_id=1  -> { slots: ["09:00", ...] }
 * GET /api/availability?month=YYYY-MM&service_id=1    -> { days: { "YYYY-MM-DD": true } }
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = Number(url.searchParams.get("service_id"));
  const date = url.searchParams.get("date");
  const month = url.searchParams.get("month");
  const excludeId = Number(url.searchParams.get("exclude_id") || 0);

  const loadAppointments = (d: string) =>
    listBlockingAppointments(d).filter((a) => a.id !== excludeId);

  const service = getService(serviceId);
  if (!service || !service.is_active) {
    return NextResponse.json(
      { error: "Serviço inválido ou indisponível." },
      { status: 400 }
    );
  }

  const cfg = getBookingConfig();
  const common = {
    duration: service.duration_minutes,
    hours: listBusinessHours(),
    breaks: listBreaks(),
    blocks: listBlocks(),
    interval: cfg.interval,
    buffer: cfg.buffer,
    minNotice: cfg.minNotice,
    maxDays: cfg.maxDays,
  };

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    const days: Record<string, boolean> = {};
    const base = monthAvailability(y, m, common, loadAppointments);
    for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) {
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days[iso] = base[iso] ?? false;
    }
    return NextResponse.json({ days }, { headers: { "Cache-Control": "no-store" } });
  }

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const slots = getAvailableSlots({
      ...common,
      date,
      appointments: loadAppointments(date),
    });
    return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json(
    { error: "Informe uma data ou mês válido." },
    { status: 400 }
  );
}
