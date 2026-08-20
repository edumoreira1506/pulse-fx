import { api } from './api';

export async function addFavorite(indicatorId: string): Promise<void> {
  try {
    await api.post('/favorites', { indicatorId });
  } catch {
    throw new Error('Failed to add favorite');
  }
}

export async function removeFavorite(indicatorId: string): Promise<void> {
  try {
    await api.delete(`/favorites/${indicatorId}`);
  } catch {
    throw new Error('Failed to remove favorite');
  }
}
