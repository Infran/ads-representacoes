import { describe, it, expect, beforeEach } from "vitest";
import {
  readPreferences,
  writePreferences,
  DEFAULT_PREFERENCES,
} from "./PreferencesContext";

// Preferências do módulo Configurações vivem só em localStorage. Estes testes
// travam o contrato: defaults, ida-e-volta, migração do legado `ads_color_mode`
// e tolerância a blob corrompido.

beforeEach(() => {
  localStorage.clear();
});

describe("readPreferences", () => {
  it("devolve os defaults quando não há nada salvo", () => {
    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("faz round-trip de um blob salvo, mesclando com os defaults", () => {
    writePreferences({
      ...DEFAULT_PREFERENCES,
      colorMode: "dark",
      fontScale: 1.3,
      contrast: "high",
      libras: true,
    });
    const read = readPreferences();
    expect(read.colorMode).toBe("dark");
    expect(read.fontScale).toBe(1.3);
    expect(read.contrast).toBe("high");
    expect(read.libras).toBe(true);
    // Chaves ausentes continuam vindo do default.
    expect(read.successToasts).toBe(DEFAULT_PREFERENCES.successToasts);
  });

  it("migra o legado `ads_color_mode` quando não há blob novo", () => {
    localStorage.setItem("ads_color_mode", "dark");
    const read = readPreferences();
    expect(read.colorMode).toBe("dark");
    // O resto permanece no default.
    expect(read.fontScale).toBe(1);
  });

  it("ignora valores de tipo errado e cai no default", () => {
    localStorage.setItem(
      "ads_preferences",
      JSON.stringify({
        colorMode: "roxo", // inválido
        fontScale: "grande", // inválido
        contrast: "high", // válido
        boldText: "sim", // inválido
        libras: true, // válido
      })
    );
    const read = readPreferences();
    expect(read.colorMode).toBe(DEFAULT_PREFERENCES.colorMode);
    expect(read.fontScale).toBe(DEFAULT_PREFERENCES.fontScale);
    expect(read.boldText).toBe(DEFAULT_PREFERENCES.boldText);
    expect(read.contrast).toBe("high");
    expect(read.libras).toBe(true);
  });

  it("não quebra com JSON inválido no storage", () => {
    localStorage.setItem("ads_preferences", "{não é json");
    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("writePreferences", () => {
  it("persiste o blob e mantém `ads_color_mode` em sincronia", () => {
    writePreferences({ ...DEFAULT_PREFERENCES, colorMode: "dark" });
    expect(localStorage.getItem("ads_color_mode")).toBe("dark");
    expect(JSON.parse(localStorage.getItem("ads_preferences")!).colorMode).toBe(
      "dark"
    );
  });
});
