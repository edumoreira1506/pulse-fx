import { api } from './api';
import { addFavorite, removeFavorite } from './favorites.service';

vi.mock('./api', () => ({
  api: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('addFavorite', () => {
  it('should post the indicator id', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await addFavorite('usd-brl');

    expect(api.post).toHaveBeenCalledWith('/favorites', {
      indicatorId: 'usd-brl',
    });
  });

  it('should throw when the request fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('network'));

    await expect(addFavorite('usd-brl')).rejects.toThrow(
      'Failed to add favorite',
    );
  });
});

describe('removeFavorite', () => {
  it('should delete the indicator id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} });

    await removeFavorite('usd-brl');

    expect(api.delete).toHaveBeenCalledWith('/favorites/usd-brl');
  });

  it('should throw when the request fails', async () => {
    vi.mocked(api.delete).mockRejectedValue(new Error('network'));

    await expect(removeFavorite('usd-brl')).rejects.toThrow(
      'Failed to remove favorite',
    );
  });
});
