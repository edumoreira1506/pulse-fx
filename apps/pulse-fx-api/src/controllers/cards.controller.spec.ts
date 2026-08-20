import { getCardHistory, getCards } from './cards.controller';
import { listCards } from '../models/cards.model';
import {
  InvalidHistoryPeriodError,
  UnknownCardIndicatorError,
  listCardHistory,
} from '../models/cards-history.model';

vi.mock('../models/cards.model', () => ({
  listCards: vi.fn(),
}));

vi.mock('../models/cards-history.model', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../models/cards-history.model')>();
  return {
    ...actual,
    listCardHistory: vi.fn(),
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

describe('getCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the cards payload', async () => {
    const cards = [{ identifier: 'usd-brl' }];
    vi.mocked(listCards).mockResolvedValue(cards as never);
    const res = mockResponse();

    await getCards({} as never, res as never);

    expect(res.json).toHaveBeenCalledWith(cards);
  });

  it('should return 502 when cards fail to load', async () => {
    vi.mocked(listCards).mockRejectedValue(new Error('Olinda down'));
    const res = mockResponse();

    await getCards({} as never, res as never);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({ message: 'Failed to load cards' });
  });
});

describe('getCardHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return history for the requested indicator and period', async () => {
    const history = [{ date: '2026-08-18', value: 5.2 }];
    vi.mocked(listCardHistory).mockResolvedValue(history);
    const res = mockResponse();

    await getCardHistory(
      {
        params: { cardIndicatorId: ' usd-brl ' },
        query: { period: 'LAST_30_DAYS' },
      } as never,
      res as never,
    );

    expect(listCardHistory).toHaveBeenCalledWith('usd-brl', 'LAST_30_DAYS');
    expect(res.json).toHaveBeenCalledWith(history);
  });

  it('should omit an empty period so the model can apply the default', async () => {
    vi.mocked(listCardHistory).mockResolvedValue([]);
    const res = mockResponse();

    await getCardHistory(
      { params: { cardIndicatorId: 'fed-funds' }, query: {} } as never,
      res as never,
    );

    expect(listCardHistory).toHaveBeenCalledWith('fed-funds', undefined);
  });

  it('should reject an unknown indicator', async () => {
    vi.mocked(listCardHistory).mockRejectedValue(
      new UnknownCardIndicatorError('unknown'),
    );
    const res = mockResponse();

    await getCardHistory(
      { params: { cardIndicatorId: 'unknown' }, query: {} } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Card indicator unknown was not found',
    });
  });

  it('should reject an invalid period for the indicator', async () => {
    vi.mocked(listCardHistory).mockRejectedValue(
      new InvalidHistoryPeriodError('usd-brl', 'LAST_TWO_YEARS'),
    );
    const res = mockResponse();

    await getCardHistory(
      {
        params: { cardIndicatorId: 'usd-brl' },
        query: { period: 'LAST_TWO_YEARS' },
      } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Period LAST_TWO_YEARS is not valid for indicator usd-brl',
    });
  });

  it('should return 502 when history fails to load', async () => {
    vi.mocked(listCardHistory).mockRejectedValue(new Error('FRED down'));
    const res = mockResponse();

    await getCardHistory(
      { params: { cardIndicatorId: 'fed-funds' }, query: {} } as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to load card history',
    });
  });
});
