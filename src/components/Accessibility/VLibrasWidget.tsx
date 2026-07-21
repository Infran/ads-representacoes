import { useEffect, useRef } from "react";
import { usePreferences } from "../../context/PreferencesContext";
import { logger } from "../../utils/logger";

// VLibras — avatar oficial do governo que traduz o conteúdo para Libras.
// Carregado SOB DEMANDA: o script externo só entra quando o usuário liga a
// preferência (módulo Configurações → Acessibilidade). Enquanto desligado,
// nada é baixado nem renderizado.
const SCRIPT_ID = "vlibras-plugin-script";
const SCRIPT_SRC = "https://vlibras.gov.br/app/vlibras-plugin.js";
const WIDGET_BASE = "https://vlibras.gov.br/app";

// Marcação exigida pelo plugin. Injetada via innerHTML para não colidir com a
// tipagem JSX (os atributos `vw*` não são padrão do DOM).
const WIDGET_MARKUP = `
  <div vw class="enabled">
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
      <div class="vw-plugin-top-wrapper"></div>
    </div>
  </div>`;

export default function VLibrasWidget() {
  const { preferences } = usePreferences();
  const enabled = preferences.libras;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = WIDGET_MARKUP;

    const initWidget = () => {
      try {
        if (window.VLibras) {
          new window.VLibras.Widget(WIDGET_BASE);
          // O script do VLibras se apoia no evento 'load' da janela (window.onload).
          // Em aplicações SPA, o script é carregado após o evento 'load' da janela
          // já ter ocorrido. Disparamos o evento manualmente para que o widget inicialize.
          window.dispatchEvent(new Event("load"));
        }
      } catch (err) {
        logger.error("Falha ao inicializar o VLibras:", err);
      }
    };

    const existing = document.getElementById(
      SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (window.VLibras) {
      initWidget();
    } else if (existing) {
      existing.addEventListener("load", initWidget, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.addEventListener("load", initWidget, { once: true });
      script.addEventListener("error", () =>
        logger.error("Não foi possível carregar o script do VLibras.")
      );
      document.body.appendChild(script);
    }

    return () => {
      // Ao desligar (ou desmontar), remove a UI que o plugin injetou. O script
      // em si permanece em cache para uma reativação rápida.
      container.innerHTML = "";
      document.querySelectorAll("[vw]").forEach((el) => el.remove());
    };
  }, [enabled]);

  if (!enabled) return null;
  // O conteúdo real é injetado pelo efeito; o container só ancora a marcação.
  return <div ref={containerRef} />;
}
