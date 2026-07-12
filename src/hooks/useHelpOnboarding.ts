import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const HELP_ONBOARDED_KEY = 'ads_help_onboarded';
const HELP_ARROW_SHOWN_KEY = 'ads_help_arrow_shown_today';

/**
 * Hook para gerenciar o onboarding da Central de Ajuda.
 * - Mostra seta apontando para Ajuda por 5s ao logar (primeira vez)
 * - Mostra badge vermelho se não clicou após a seta
 * - Limpa ambos quando visita /Ajuda
 */
export const useHelpOnboarding = () => {
  const location = useLocation();
  const [showArrow, setShowArrow] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  // Ao montar: verificar se deve mostrar a seta
  useEffect(() => {
    const hasOnboarded = localStorage.getItem(HELP_ONBOARDED_KEY);
    const arrowShownToday = localStorage.getItem(HELP_ARROW_SHOWN_KEY);

    // Mostrar seta apenas se nunca fez onboarding E ainda não mostrou hoje
    if (!hasOnboarded && !arrowShownToday) {
      setShowArrow(true);
      localStorage.setItem(HELP_ARROW_SHOWN_KEY, 'true');

      // Seta desaparece após 5 segundos, badge aparece
      const timer = setTimeout(() => {
        setShowArrow(false);
        setShowBadge(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else if (!hasOnboarded && arrowShownToday) {
      // Já mostrou a seta hoje, mas não clicou — mostrar badge
      setShowBadge(true);
    }
  }, []);

  // Ao navegar para /Ajuda: marcar como onboarded e remover indicadores
  useEffect(() => {
    if (location.pathname === '/Ajuda') {
      localStorage.setItem(HELP_ONBOARDED_KEY, 'true');
      setShowArrow(false);
      setShowBadge(false);
    }
  }, [location.pathname]);

  return { showArrow, showBadge };
};
