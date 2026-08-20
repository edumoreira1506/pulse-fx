import { useEffect, useState } from 'react';
import {
  getCardHistory,
  type HistoryItem,
  type HistoryPeriod,
} from '../services/cards.service';

export function useCardHistory(
  cardIndicatorId: string | null,
  period: HistoryPeriod | null,
) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cardIndicatorId || !period) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCardHistory(cardIndicatorId, period);
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'An error occurred while loading history';
          setError(message);
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [cardIndicatorId, period]);

  return {
    items,
    loading,
    error,
  };
}

export default useCardHistory;
