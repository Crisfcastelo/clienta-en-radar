import { describe, expect, it } from "vitest";
import {
  escapeLikePattern,
  filterInquiries,
  filtersHref,
  hasActiveFilters,
  moreFiltersCount,
  normalizeForSearch,
  parseFilters,
} from "./filters";
import { makeInquiry } from "./test-factory";

const TODAY = "2026-10-28";
const TZ = "Europe/Madrid";

describe("parseFilters", () => {
  it("lee valores válidos de la URL", () => {
    expect(parseFilters({ q: "  lucía ", estado: "resuelta", canal: "instagram", fecha: "7d" })).toEqual({
      q: "lucía",
      status: "resuelta",
      channel: "instagram",
      range: "7d",
    });
  });

  it("ignora valores desconocidos o manipulados", () => {
    expect(parseFilters({ estado: "borrada", canal: "telegram", fecha: "ayer" })).toEqual({
      q: "",
      status: null,
      channel: null,
      range: "todas",
    });
  });

  it("recorta búsquedas muy largas", () => {
    expect(parseFilters({ q: "a".repeat(500) }).q).toHaveLength(80);
  });

  it("detecta si hay filtros activos", () => {
    expect(hasActiveFilters(parseFilters({}))).toBe(false);
    expect(hasActiveFilters(parseFilters({ canal: "email" }))).toBe(true);
    expect(moreFiltersCount(parseFilters({ estado: "resuelta" }))).toBe(0);
    expect(moreFiltersCount(parseFilters({ canal: "email", fecha: "7d" }))).toBe(2);
  });

  it("construye la URL solo con los filtros puestos", () => {
    expect(filtersHref(parseFilters({}))).toBe("/consultas");
    expect(filtersHref({ ...parseFilters({ canal: "email", q: "ana" }), status: "resuelta" })).toBe(
      "/consultas?q=ana&estado=resuelta&canal=email",
    );
  });
});

describe("búsqueda", () => {
  it("no distingue tildes ni mayúsculas", () => {
    expect(normalizeForSearch("Lucía Peña")).toBe("lucia pena");
  });

  it("busca en nombre y en descripción", () => {
    const list = [
      makeInquiry({ customerLabel: "Lucía", summary: "Precio del curso" }),
      makeInquiry({ customerLabel: "Marta", summary: "Duda sobre envío a Canarias" }),
    ];
    const byName = filterInquiries(list, parseFilters({ q: "lucia" }), TODAY, TZ);
    const bySummary = filterInquiries(list, parseFilters({ q: "canarias" }), TODAY, TZ);
    expect(byName.map((i) => i.customerLabel)).toEqual(["Lucía"]);
    expect(bySummary.map((i) => i.customerLabel)).toEqual(["Marta"]);
  });

  it("escapa comodines para SQL", () => {
    expect(escapeLikePattern("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});

describe("filterInquiries", () => {
  const list = [
    makeInquiry({ customerLabel: "activa wa", channel: "whatsapp", createdAt: "2026-10-28T08:00:00Z" }),
    makeInquiry({
      customerLabel: "activa ig",
      channel: "instagram",
      status: "esperando_respuesta",
      createdAt: "2026-10-10T08:00:00Z",
    }),
    makeInquiry({
      customerLabel: "resuelta",
      channel: "email",
      status: "resuelta",
      resolvedAt: "2026-10-27T08:00:00Z",
      createdAt: "2026-09-01T08:00:00Z",
    }),
  ];

  it("'Todas' incluye también las resueltas: quedan en el historial", () => {
    expect(filterInquiries(list, parseFilters({}), TODAY, TZ)).toHaveLength(3);
    expect(filterInquiries(list, parseFilters({ estado: "resuelta" }), TODAY, TZ).map((i) => i.customerLabel)).toEqual([
      "resuelta",
    ]);
  });

  it("filtra por estado y canal", () => {
    expect(filterInquiries(list, parseFilters({ estado: "esperando_respuesta" }), TODAY, TZ)).toHaveLength(1);
    expect(filterInquiries(list, parseFilters({ canal: "whatsapp" }), TODAY, TZ)).toHaveLength(1);
  });

  it("filtra por fecha de recepción", () => {
    expect(filterInquiries(list, parseFilters({ fecha: "hoy" }), TODAY, TZ).map((i) => i.customerLabel)).toEqual([
      "activa wa",
    ]);
    expect(filterInquiries(list, parseFilters({ fecha: "30d" }), TODAY, TZ)).toHaveLength(2);
    expect(filterInquiries(list, parseFilters({ fecha: "todas" }), TODAY, TZ)).toHaveLength(3);
  });

  it("'hoy' usa el día de Madrid, no el de UTC", () => {
    // 23:30 UTC del 27 = 00:30 del 28 en Madrid (horario de invierno)
    const lateNight = makeInquiry({ customerLabel: "medianoche", createdAt: "2026-10-27T23:30:00Z" });
    expect(filterInquiries([lateNight], parseFilters({ fecha: "hoy" }), TODAY, TZ)).toHaveLength(1);
  });
});
