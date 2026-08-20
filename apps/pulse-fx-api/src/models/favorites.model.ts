import { In } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { getDataSource } from '../configuration/database';

export class FavoriteAlreadyExistsError extends Error {
  constructor(indicatorId: string) {
    super(`Indicator ${indicatorId} is already favorited`);
    this.name = 'FavoriteAlreadyExistsError';
  }
}

export class FavoriteNotFoundError extends Error {
  constructor(indicatorId: string) {
    super(`Favorite for indicator ${indicatorId} was not found`);
    this.name = 'FavoriteNotFoundError';
  }
}

export async function findFavoriteIndicatorIds(
  indicatorIds: string[],
): Promise<Set<string>> {
  if (indicatorIds.length === 0) {
    return new Set();
  }

  const favorites = await getFavoriteRepository().find({
    where: { indicatorId: In(indicatorIds) },
  });

  return new Set(favorites.map((favorite) => favorite.indicatorId));
}

export async function createFavorite(indicatorId: string): Promise<Favorite> {
  const existing = await findFavoriteByIndicatorId(indicatorId);

  if (existing) {
    throw new FavoriteAlreadyExistsError(indicatorId);
  }

  return getFavoriteRepository().save({ indicatorId });
}

export async function deleteFavorite(indicatorId: string): Promise<void> {
  const existing = await findFavoriteByIndicatorId(indicatorId);

  if (!existing) {
    throw new FavoriteNotFoundError(indicatorId);
  }

  await getFavoriteRepository().remove(existing);
}

function getFavoriteRepository() {
  return getDataSource().getRepository(Favorite);
}

function findFavoriteByIndicatorId(indicatorId: string): Promise<Favorite | null> {
  return getFavoriteRepository().findOneBy({ indicatorId });
}
