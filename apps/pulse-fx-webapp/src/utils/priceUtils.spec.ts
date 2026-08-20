import {
  formatPercentage,
  formatPrice,
  formatReais,
  truncateToTwoDecimals,
} from './priceUtils';

describe('truncateToTwoDecimals', () => {
  it('should keep two decimals without rounding', () => {
    expect(truncateToTwoDecimals(5.1862)).toBe(5.18);
    expect(truncateToTwoDecimals(5.199)).toBe(5.19);
    expect(truncateToTwoDecimals(5.1)).toBe(5.1);
  });
});

describe('formatReais', () => {
  it('should format with R$ and truncate instead of rounding', () => {
    expect(formatReais(5.1862)).toMatch(/R\$\s*5,18/);
    expect(formatReais(5.1862)).not.toMatch(/5,19/);
  });
});

describe('formatPrice', () => {
  it('should format cents as truncated reais', () => {
    expect(formatPrice(518)).toMatch(/R\$\s*5,18/);
  });
});

describe('formatPercentage', () => {
  it('should format with a comma and a percent sign', () => {
    expect(formatPercentage(4.33)).toBe('4,33%');
    expect(formatPercentage(322.4)).toBe('322,40%');
  });
});
