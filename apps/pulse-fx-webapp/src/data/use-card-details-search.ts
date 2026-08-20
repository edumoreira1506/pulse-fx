import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HistoryPeriod } from '../services/cards.service';
import { getDefaultHistoryPeriod } from '../utils/history-periods';

export function useCardDetailsSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cardId = searchParams.get('card');
  const periodParam = searchParams.get('period');
  const tabParam = searchParams.get('tab');
  const showFavoritesOnly = tabParam === 'favoritos';

  const openCard = useCallback(
    (identifier: string) => {
      if (cardId === identifier && periodParam) {
        return;
      }

      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('card', identifier);
        next.set('period', getDefaultHistoryPeriod(identifier));
        return next;
      });
    },
    [cardId, periodParam, setSearchParams],
  );

  const setPeriod = useCallback(
    (period: HistoryPeriod) => {
      if (periodParam === period) {
        return;
      }

      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('period', period);
        return next;
      });
    },
    [periodParam, setSearchParams],
  );

  const close = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('card');
      next.delete('period');
      return next;
    });
  }, [setSearchParams]);

  const setTab = useCallback(
    (tab: 'todos' | 'favoritos') => {
      const isFavorites = tab === 'favoritos';
      if (showFavoritesOnly === isFavorites) {
        return;
      }

      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (isFavorites) {
          next.set('tab', 'favoritos');
        } else {
          next.delete('tab');
        }
        return next;
      });
    },
    [showFavoritesOnly, setSearchParams],
  );

  return {
    cardId,
    periodParam,
    showFavoritesOnly,
    openCard,
    setPeriod,
    close,
    setTab,
  };
}

export default useCardDetailsSearch;
