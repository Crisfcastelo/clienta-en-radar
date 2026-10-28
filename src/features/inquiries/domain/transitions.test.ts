import { describe, expect, it } from "vitest";
import { ACTION_LABELS, applyAction, availableActions } from "./transitions";

describe("acciones disponibles según el estado", () => {
  it("usa los textos definitivos", () => {
    expect(ACTION_LABELS).toEqual({
      respond: "Marcar como respondida",
      prepare_follow_up: "Preparar seguimiento",
      resolve: "Resolver",
      reopen: "Reabrir",
    });
  });

  it("ofrece como mucho dos acciones, y Resolver siempre que esté abierta", () => {
    expect(availableActions("por_responder")).toEqual(["respond", "resolve"]);
    expect(availableActions("esperando_respuesta")).toEqual(["prepare_follow_up", "resolve"]);
    expect(availableActions("hacer_seguimiento")).toEqual(["respond", "resolve"]);
    expect(availableActions("resuelta")).toEqual(["reopen"]);
  });
});

describe("applyAction", () => {
  it("marcar como respondida pasa a Esperando respuesta y da por hecha la revisión", () => {
    expect(applyAction("respond")).toEqual({ status: "esperando_respuesta", followUpOn: null });
  });

  it("preparar seguimiento guarda la fecha elegida", () => {
    expect(applyAction("prepare_follow_up", "2026-11-02")).toEqual({
      status: "hacer_seguimiento",
      followUpOn: "2026-11-02",
    });
  });

  it("resolver y reabrir limpian la fecha para que no reaparezca una revisión antigua", () => {
    expect(applyAction("resolve", "2026-11-02")).toEqual({ status: "resuelta", followUpOn: null });
    expect(applyAction("reopen")).toEqual({ status: "por_responder", followUpOn: null });
  });
});
