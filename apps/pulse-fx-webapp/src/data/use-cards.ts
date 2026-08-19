import { useEffect, useState } from 'react';
import { getCards, type Card } from '../services/cards.service';

export type { Card };

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCards();
        setCards(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'An error occurred while loading cards';
        setError(message);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  return {
    cards,
    loading,
    error,
  };
}

export default useCards;
