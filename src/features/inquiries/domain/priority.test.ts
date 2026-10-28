import { describe, expect, it } from "vitest";
import { buildTodaySummary, followUpState, isOpen, needsReview, sortByNextAction } from "./priority";
import { makeInquiry } from "./test-factory";

// Miércoles 28 de octubre de 2026. La semana empieza el lunes 26.
const TODAY = "2026-10-28";
const TZ = "Europe/Madrid";

describe("isOpen", () => {
  it("solo una resuelta deja de estar abierta", () => {
    expect(isOpen(makeInquiry({ status: "resuelta", resolvedAt: "2026-10-27T10:00:00Z" }))).toBe(false);
    expect(isOpen(makeInquiry({ status: "esperando_respuesta" }))).toBe(true);
  });
});

describe("followUpState", () => {
  it("distingue vencido, hoy, próximo y sin fecha", () => {
    expect(followUpState(makeInquiry({ followUpOn: "2026-10-27" }), TODAY)).toBe("overdue");
    expect(followUpState(makeInquiry({ followUpOn: TODAY }), TODAY)).toBe("today");
    expect(followUpState(makeInquiry({ followUpOn: "2026-10-29" }), TODAY)).toBe("upcoming");
    expect(followUpState(makeInquiry(), TODAY)).toBe("none");
  });

  it("una consulta resuelta nunca está vencida", () => {
    const resolved = makeInquiry({ status: "resuelta", followUpOn: "2026-01-01", resolvedAt: "x" });
    expect(followUpState(resolved, TODAY)).toBe("none");
  });

  it("no cambia el estado elegido por la usuaria", () => {
    const waiting = makeInquiry({ status: "esperando_respuesta", followUpOn: "2026-10-20" });
    expect(followUpState(waiting, TODAY)).toBe("overdue");
    expect(waiting.status).toBe("esperando_respuesta");
  });
});

describe("needsReview", () => {
  it("entra en Para revisar con fecha de hoy o pasada", () => {
    expect(needsReview(makeInquiry({ status: "esperando_respuesta", followUpOn: TODAY }), TODAY)).toBe(true);
    expect(needsReview(makeInquiry({ status: "esperando_respuesta", followUpOn: "2026-10-01" }), TODAY)).toBe(true);
    expect(needsReview(makeInquiry({ status: "esperando_respuesta", followUpOn: "2026-11-01" }), TODAY)).toBe(false);
  });

  it("Hacer seguimiento sin fecha no se queda fuera del radar", () => {
    expect(needsReview(makeInquiry({ status: "hacer_seguimiento" }), TODAY)).toBe(true);
    expect(needsReview(makeInquiry({ status: "esperando_respuesta" }), TODAY)).toBe(false);
  });
});

describe("buildTodaySummary", () => {
  const pendingOld = makeInquiry({ customerLabel: "pendiente antigua", createdAt: "2026-10-01T09:00:00Z" });
  const pendingNew = makeInquiry({ customerLabel: "pendiente nueva", createdAt: "2026-10-25T09:00:00Z" });
  const dueToday = makeInquiry({ customerLabel: "hoy", status: "esperando_respuesta", followUpOn: TODAY });
  const overdueRecent = makeInquiry({
    customerLabel: "vencida ayer",
    status: "hacer_seguimiento",
    followUpOn: "2026-10-27",
  });
  const overdueOld = makeInquiry({
    customerLabel: "vencida hace días",
    status: "esperando_respuesta",
    followUpOn: "2026-10-20",
  });
  const waitingFuture = makeInquiry({
    customerLabel: "futura",
    status: "esperando_respuesta",
    followUpOn: "2026-11-05",
  });
  const resolvedThisWeek = makeInquiry({
    customerLabel: "resuelta el lunes",
    status: "resuelta",
    resolvedAt: "2026-10-26T08:00:00Z",
  });
  const resolvedLastWeek = makeInquiry({
    customerLabel: "resuelta el domingo",
    status: "resuelta",
    // 22:30 UTC del sábado 24 = domingo 25 a las 00:30 en Madrid: semana anterior.
    resolvedAt: "2026-10-24T22:30:00Z",
  });

  const summary = buildTodaySummary(
    [pendingNew, resolvedThisWeek, dueToday, overdueRecent, resolvedLastWeek, pendingOld, waitingFuture, overdueOld],
    TODAY,
    TZ,
  );

  it("Para revisar: vencidas primero (la más antigua arriba) y después las de hoy", () => {
    expect(summary.toReview.map((i) => i.customerLabel)).toEqual(["vencida hace días", "vencida ayer", "hoy"]);
  });

  it("Por responder: la más antigua primero", () => {
    expect(summary.toAnswer.map((i) => i.customerLabel)).toEqual(["pendiente antigua", "pendiente nueva"]);
  });

  it("indicadores: por responder, para revisar y resueltas esta semana", () => {
    expect(summary.pendingCount).toBe(2);
    expect(summary.reviewCount).toBe(3);
    expect(summary.resolvedThisWeek).toBe(1);
  });

  it("una por responder con revisión vencida aparece una sola vez, en Para revisar", () => {
    const inquiry = makeInquiry({ followUpOn: "2026-10-26" });
    const result = buildTodaySummary([inquiry], TODAY, TZ);
    expect(result.toReview).toHaveLength(1);
    expect(result.toAnswer).toHaveLength(0);
    expect(result.pendingCount).toBe(1);
  });

  it("sin consultas: listas vacías y marca de primer acceso", () => {
    const result = buildTodaySummary([], TODAY, TZ);
    expect(result.toReview).toEqual([]);
    expect(result.toAnswer).toEqual([]);
    expect(result.hasAnyInquiry).toBe(false);
  });

  it("solo resueltas: nada pendiente pero no es primer acceso", () => {
    const result = buildTodaySummary([resolvedThisWeek], TODAY, TZ);
    expect(result.toReview).toEqual([]);
    expect(result.hasAnyInquiry).toBe(true);
  });
});

describe("sortByNextAction", () => {
  it("pone lo urgente arriba y lo resuelto al final", () => {
    const list = [
      makeInquiry({ customerLabel: "resuelta", status: "resuelta", resolvedAt: "x" }),
      makeInquiry({ customerLabel: "esperando sin fecha", status: "esperando_respuesta" }),
      makeInquiry({ customerLabel: "próxima", status: "esperando_respuesta", followUpOn: "2026-11-02" }),
      makeInquiry({ customerLabel: "por responder" }),
      makeInquiry({ customerLabel: "vencida", status: "hacer_seguimiento", followUpOn: "2026-10-01" }),
      makeInquiry({ customerLabel: "seguimiento sin fecha", status: "hacer_seguimiento" }),
      makeInquiry({ customerLabel: "hoy", status: "esperando_respuesta", followUpOn: TODAY }),
    ];
    expect(sortByNextAction(list, TODAY).map((i) => i.customerLabel)).toEqual([
      "vencida",
      "hoy",
      "por responder",
      "seguimiento sin fecha",
      "próxima",
      "esperando sin fecha",
      "resuelta",
    ]);
  });
});
