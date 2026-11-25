import { NextResponse } from "next/server";
import { BookingError, createBooking } from "@/lib/booking";
import { runMutation } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** POST /api/appointments — cria um agendamento validado no backend. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // `runMutation` recarrega o estado mais recente antes de validar e grava
    // o snapshot depois: a trava evita reservas duplicadas entre instâncias.
    const appointment = await runMutation(() =>
      createBooking({
        service_id: Number(body.service_id),
        client_name: String(body.client_name ?? ""),
        client_phone: String(body.client_phone ?? ""),
        date: String(body.date ?? ""),
        start_time: String(body.start_time ?? ""),
        notes: body.notes ? String(body.notes) : "",
      })
    );

    return NextResponse.json(
      {
        ok: true,
        appointment: {
          id: appointment.id,
          service: appointment.service_name_snapshot,
          price: appointment.service_price_snapshot,
          duration: appointment.service_duration_snapshot,
          date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          client_name: appointment.client_name_snapshot,
          client_phone: appointment.client_phone_snapshot,
          status: appointment.status,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Falha ao criar agendamento:", err);
    return NextResponse.json(
      { error: "Não foi possível concluir o agendamento. Tente novamente." },
      { status: 500 }
    );
  }
}
