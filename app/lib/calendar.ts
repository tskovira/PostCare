import type { Appointment } from "./types";

function escapeCalendarText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function localCalendarDate(value: Date) {
  const part = (number: number) => String(number).padStart(2, "0");
  return `${value.getFullYear()}${part(value.getMonth() + 1)}${part(value.getDate())}T${part(value.getHours())}${part(value.getMinutes())}00`;
}

function utcCalendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function downloadAppointmentCalendar(appointment: Appointment) {
  const startsAt = new Date(appointment.startsAt);
  const endsAt = new Date(startsAt.getTime() + appointment.durationMinutes * 60_000);
  const provider = [appointment.provider, appointment.facility]
    .filter(Boolean)
    .join(" · ");
  const description = [
    provider && `Provider: ${provider}`,
    appointment.preparation && `Preparation: ${appointment.preparation}`,
    "Added from PostCare",
  ]
    .filter(Boolean)
    .join("\n");
  const location = [appointment.facility, appointment.location]
    .filter(Boolean)
    .join(" · ");
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PostCare//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:appointment-${appointment.id}@americanpostcare.com`,
    `DTSTAMP:${utcCalendarDate(new Date())}`,
    `DTSTART:${localCalendarDate(startsAt)}`,
    `DTEND:${localCalendarDate(endsAt)}`,
    `SUMMARY:${escapeCalendarText(appointment.title)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${appointment.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "postcare-appointment"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
