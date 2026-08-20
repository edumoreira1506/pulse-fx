import { useEffect, useState } from 'react';
import { getCards, type Card } from '../services/cards.service';
import { addFavorite, removeFavorite } from '../services/favorites.service';

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

  const toggleFavorite = async (identifier: string, isFavorite: boolean) => {
    if (isFavorite) {
      await removeFavorite(identifier);
    } else {
      await addFavorite(identifier);
    }

    setCards((current) =>
      current.map((card) =>
        card.identifier === identifier
          ? { ...card, isFavorite: !isFavorite }
          : card,
      ),
    );
  };

  return {
    cards,
    loading,
    error,
    toggleFavorite,
  };
}

export default useCards;
