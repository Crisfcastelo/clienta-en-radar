import { describe, expect, it } from "vitest";
import { buildTodaySummary, followUpState, isOpen, sortByNextAction } from "./priority";
import { makeInquiry } from "./test-factory";

const TODAY = "2026-10-28";

describe("isOpen", () => {
  it("una resuelta o archivada no está abierta", () => {
    expect(isOpen(makeInquiry({ status: "resuelta", resolvedAt: "2026-10-27T10:00:00Z" }))).toBe(false);
    expect(isOpen(makeInquiry({ archivedAt: "2026-10-27T10:00:00Z" }))).toBe(false);
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

describe("buildTodaySummary", () => {
  it("ordena vencidas, luego hoy, luego por responder", () => {
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
    const resolved = makeInquiry({ customerLabel: "resuelta", status: "resuelta", resolvedAt: "x" });
    const archived = makeInquiry({ customerLabel: "archivada", archivedAt: "x" });

    const summary = buildTodaySummary(
      [pendingNew, resolved, dueToday, overdueRecent, archived, pendingOld, waitingFuture, overdueOld],
      TODAY,
    );

    expect(summary.actions.map((a) => a.inquiry.customerLabel)).toEqual([
      "vencida hace días",
      "vencida ayer",
      "hoy",
      "pendiente antigua",
      "pendiente nueva",
    ]);
    expect(summary.actions.map((a) => a.reason)).toEqual(["overdue", "overdue", "due_today", "pending", "pending"]);
  });

  it("cuenta por responder y en seguimiento sin incluir resueltas ni archivadas", () => {
    const summary = buildTodaySummary(
      [
        makeInquiry(),
        makeInquiry(),
        makeInquiry({ archivedAt: "x" }),
        makeInquiry({ status: "esperando_respuesta" }),
        makeInquiry({ status: "hacer_seguimiento" }),
        makeInquiry({ status: "hacer_seguimiento", archivedAt: "x" }),
        makeInquiry({ status: "resuelta", resolvedAt: "x" }),
      ],
      TODAY,
    );
    expect(summary.pendingCount).toBe(2);
    expect(summary.followingCount).toBe(2);
  });

  it("una por responder con seguimiento vencido aparece una sola vez, como vencida", () => {
    const inquiry = makeInquiry({ followUpOn: "2026-10-26" });
    const summary = buildTodaySummary([inquiry], TODAY);
    expect(summary.actions).toHaveLength(1);
    expect(summary.actions[0]?.reason).toBe("overdue");
  });

  it("sin consultas: lista vacía y marca de primer acceso", () => {
    const summary = buildTodaySummary([], TODAY);
    expect(summary.actions).toEqual([]);
    expect(summary.hasAnyInquiry).toBe(false);
  });

  it("solo resueltas: lista vacía pero no es primer acceso", () => {
    const summary = buildTodaySummary([makeInquiry({ status: "resuelta", resolvedAt: "x" })], TODAY);
    expect(summary.actions).toEqual([]);
    expect(summary.hasAnyInquiry).toBe(true);
  });
});

describe("sortByNextAction", () => {
  it("pone lo urgente arriba y lo cerrado al final", () => {
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
