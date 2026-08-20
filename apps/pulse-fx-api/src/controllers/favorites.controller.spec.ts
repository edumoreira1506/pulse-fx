import { postFavorite, removeFavorite } from './favorites.controller';
import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
  createFavorite,
  deleteFavorite,
} from '../models/favorites.model';

vi.mock('../models/favorites.model', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../models/favorites.model')>();
  return {
    ...actual,
    createFavorite: vi.fn(),
    deleteFavorite: vi.fn(),
  };
});

function mockResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('postFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a favorite', async () => {
    const favorite = { id: 1, indicatorId: 'usd-brl' };
    vi.mocked(createFavorite).mockResolvedValue(favorite as never);
    const res = mockResponse();

    await postFavorite(
      { body: { indicatorId: ' usd-brl ' } } as never,
      res as never,
    );

    expect(createFavorite).toHaveBeenCalledWith('usd-brl');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(favorite);
  });

  it('should reject a missing indicatorId', async () => {
    const res = mockResponse();

    await postFavorite({ body: {} } as never, res as never);

    expect(createFavorite).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'indicatorId is required' });
  });

  it('should reject an already favorited indicator', async () => {
    vi.mocked(createFavorite).mockRejectedValue(
      new FavoriteAlreadyExistsError('usd-brl'),
    );
    const res = mockResponse();

    await postFavorite({ body: { indicatorId: 'usd-brl' } } as never, res as never);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Indicator usd-brl is already favorited',
    });
  });
});

describe('removeFavorite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a favorite', async () => {
    vi.mocked(deleteFavorite).mockResolvedValue(undefined);
    const res = mockResponse();

    await removeFavorite(
      { params: { cardIndicatorId: 'usd-brl' } } as never,
      res as never,
    );

    expect(deleteFavorite).toHaveBeenCalledWith('usd-brl');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('should reject a missing favorite', async () => {
    vi.mocked(deleteFavorite).mockRejectedValue(
      new FavoriteNotFoundError('usd-brl'),
    );
    const res = mockResponse();

    await removeFavorite(
      { params: { cardIndicatorId: 'usd-brl' } } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Favorite for indicator usd-brl was not found',
    });
  });
});
