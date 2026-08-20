import { In } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { getDataSource } from '../configuration/database';

export async function findFavoriteIndicatorIds(
  indicatorIds: string[],
): Promise<Set<string>> {
  if (indicatorIds.length === 0) {
    return new Set();
  }

  const favorites = await getDataSource()
    .getRepository(Favorite)
    .find({
      where: { indicatorId: In(indicatorIds) },
    });

  return new Set(favorites.map((favorite) => favorite.indicatorId));
}
