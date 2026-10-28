import { describe, expect, it } from "vitest";
import {
  addDays,
  dayPartIn,
  daysBetween,
  formatFollowUp,
  formatReceived,
  isValidIsoDate,
  startOfWeek,
  todayIn,
} from "./dates";

const TZ = "Europe/Madrid";

describe("todayIn", () => {
  it("usa el día local de Madrid y no el de UTC", () => {
    // 23:30 UTC del 27 de octubre = 00:30 del 28 en Madrid (UTC+1)
    expect(todayIn(TZ, new Date("2026-10-27T23:30:00Z"))).toBe("2026-10-28");
    // 22:30 UTC del 27 de junio = 00:30 del 28 en Madrid (UTC+2, horario de verano)
    expect(todayIn(TZ, new Date("2026-06-27T22:30:00Z"))).toBe("2026-06-28");
  });

  it("funciona en otras zonas, como Canarias", () => {
    expect(todayIn("Atlantic/Canary", new Date("2026-10-27T23:30:00Z"))).toBe("2026-10-27");
  });
});

describe("cálculos de días", () => {
  it("suma días cruzando el cambio de hora", () => {
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2027-03-27", 2)).toBe("2027-03-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("cuenta días de calendario", () => {
    expect(daysBetween("2026-10-25", "2026-10-26")).toBe(1);
    expect(daysBetween("2026-10-28", "2026-10-20")).toBe(-8);
  });

  it("la semana empieza el lunes", () => {
    expect(startOfWeek("2026-10-28")).toBe("2026-10-26"); // miércoles
    expect(startOfWeek("2026-10-26")).toBe("2026-10-26"); // lunes
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26"); // domingo
  });

  it("valida fechas", () => {
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2027-02-29")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-1-1")).toBe(false);
  });
});

describe("textos de fechas", () => {
  it("seguimiento", () => {
    expect(formatFollowUp("2026-10-28", "2026-10-28")).toBe("hoy");
    expect(formatFollowUp("2026-10-29", "2026-10-28")).toBe("mañana");
    expect(formatFollowUp("2026-10-27", "2026-10-28")).toBe("ayer");
    expect(formatFollowUp("2026-10-30", "2026-10-28")).toBe("vie 30 oct");
  });

  it("recepción", () => {
    const now = new Date("2026-10-28T10:00:00Z");
    expect(formatReceived("2026-10-28T08:00:00Z", TZ, now)).toBe("hoy");
    expect(formatReceived("2026-10-27T08:00:00Z", TZ, now)).toBe("ayer");
    expect(formatReceived("2026-10-25T08:00:00Z", TZ, now)).toBe("hace 3 días");
    expect(formatReceived("2026-10-12T08:00:00Z", TZ, now)).toBe("el 12 oct");
  });

  it("parte del día para el saludo", () => {
    expect(dayPartIn(TZ, new Date("2026-10-28T08:00:00Z"))).toBe("morning");
    expect(dayPartIn(TZ, new Date("2026-10-28T15:00:00Z"))).toBe("afternoon");
    expect(dayPartIn(TZ, new Date("2026-10-28T21:30:00Z"))).toBe("evening");
  });
});
