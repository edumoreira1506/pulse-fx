import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HistoryPeriod } from '../services/cards.service';
import { getDefaultHistoryPeriod } from '../utils/history-periods';

export function useCardDetailsSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cardId = searchParams.get('card');
  const periodParam = searchParams.get('period');

  const openCard = useCallback(
    (identifier: string) => {
      if (cardId === identifier && periodParam) {
        return;
      }

      setSearchParams({
        card: identifier,
        period: getDefaultHistoryPeriod(identifier),
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

  return {
    cardId,
    periodParam,
    openCard,
    setPeriod,
    close,
  };
}

export default useCardDetailsSearch;
