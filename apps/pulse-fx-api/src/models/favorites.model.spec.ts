import { getDataSource } from '../configuration/database';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
  createFavorite,
  deleteFavorite,
  findFavoriteIndicatorIds,
} from './favorites.model';

vi.mock('../configuration/database', () => ({
  getDataSource: vi.fn(),
}));

const repository = {
  find: vi.fn(),
  findOneBy: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
};

describe('favorites.model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDataSource).mockReturnValue({
      getRepository: () => repository,
    } as never);
  });

  describe('findFavoriteIndicatorIds', () => {
    it('should return an empty set when no ids are requested', async () => {
      await expect(findFavoriteIndicatorIds([])).resolves.toEqual(new Set());
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('should return the favorited indicator ids', async () => {
      repository.find.mockResolvedValue([{ indicatorId: 'eur-brl' }]);

      await expect(
        findFavoriteIndicatorIds(['usd-brl', 'eur-brl']),
      ).resolves.toEqual(new Set(['eur-brl']));
    });
  });

  describe('createFavorite', () => {
    it('should save a new favorite', async () => {
      const favorite = { id: 1, indicatorId: 'usd-brl' };
      repository.findOneBy.mockResolvedValue(null);
      repository.save.mockResolvedValue(favorite);

      await expect(createFavorite('usd-brl')).resolves.toEqual(favorite);
      expect(repository.save).toHaveBeenCalledWith({ indicatorId: 'usd-brl' });
    });

    it('should throw when the indicator is already favorited', async () => {
      repository.findOneBy.mockResolvedValue({ id: 1, indicatorId: 'usd-brl' });

      await expect(createFavorite('usd-brl')).rejects.toBeInstanceOf(
        FavoriteAlreadyExistsError,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteFavorite', () => {
    it('should remove an existing favorite', async () => {
      const favorite = { id: 1, indicatorId: 'usd-brl' };
      repository.findOneBy.mockResolvedValue(favorite);
      repository.remove.mockResolvedValue(favorite);

      await deleteFavorite('usd-brl');

      expect(repository.remove).toHaveBeenCalledWith(favorite);
    });

    it('should throw when the favorite does not exist', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(deleteFavorite('usd-brl')).rejects.toBeInstanceOf(
        FavoriteNotFoundError,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
