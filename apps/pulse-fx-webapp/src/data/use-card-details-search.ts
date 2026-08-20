import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HistoryPeriod } from '../services/cards.service';
import { getDefaultHistoryPeriod } from '../utils/history-periods';

export function useCardDetailsSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cardId = searchParams.get('card');
  const periodParam = searchParams.get('period');
  const showFavoritesOnly = searchParams.get('favorites') === '1';

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

  const toggleFavoritesOnly = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (next.get('favorites') === '1') {
        next.delete('favorites');
      } else {
        next.set('favorites', '1');
      }
      return next;
    });
  }, [setSearchParams]);

  return {
    cardId,
    periodParam,
    showFavoritesOnly,
    openCard,
    setPeriod,
    close,
    toggleFavoritesOnly,
  };
}

export default useCardDetailsSearch;
