export function formatIndicator(value: number): { arrow: string; label: string } {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: value === 0 ? 'auto' : 'always',
  }).format(value);

  if (value > 0) {
    return { arrow: '▲', label: `${formatted}%` };
  }

  if (value < 0) {
    return { arrow: '▼', label: `${formatted}%` };
  }

  return { arrow: '→', label: `${formatted}%` };
}
