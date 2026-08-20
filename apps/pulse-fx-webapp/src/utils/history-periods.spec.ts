import {
  getDefaultHistoryPeriod,
  getHistoryPeriodOptions,
  resolveHistoryPeriod,
} from './history-periods';

describe('history periods', () => {
  it('should return daily options for FX cards', () => {
    expect(getHistoryPeriodOptions('usd-brl').map((option) => option.value)).toEqual([
      'LAST_5_BUSINESS_DAY',
      'LAST_30_DAYS',
      'LAST_90_DAYS',
      'LAST_ONE_YEAR',
    ]);
  });

  it('should return monthly options for FRED cards', () => {
    expect(
      getHistoryPeriodOptions('fed-funds').map((option) => option.value),
    ).toEqual(['LAST_ONE_YEAR', 'LAST_TWO_YEARS', 'LAST_FIVE_YEARS']);
  });

  it('should default FX cards to five business days', () => {
    expect(getDefaultHistoryPeriod('eur-brl')).toBe('LAST_5_BUSINESS_DAY');
  });

  it('should default monthly cards to one year', () => {
    expect(getDefaultHistoryPeriod('us-cpi')).toBe('LAST_ONE_YEAR');
  });

  it('should fall back to the default when the period is invalid', () => {
    expect(resolveHistoryPeriod('usd-brl', 'LAST_TWO_YEARS')).toBe(
      'LAST_5_BUSINESS_DAY',
    );
  });

  it('should keep a valid period from the URL', () => {
    expect(resolveHistoryPeriod('us-cpi', 'LAST_FIVE_YEARS')).toBe(
      'LAST_FIVE_YEARS',
    );
  });
});
