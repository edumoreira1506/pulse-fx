export function formatReferenceDate(isoDate: string, isPercentage: boolean): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const options: Intl.DateTimeFormatOptions = isPercentage
    ? { month: 'short', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' };

  const parts = new Intl.DateTimeFormat('pt-BR', options).formatToParts(date);
  const dayPart = parts.find((part) => part.type === 'day')?.value;
  const monthPart = parts
    .find((part) => part.type === 'month')
    ?.value.replace('.', '');
  const yearPart = parts.find((part) => part.type === 'year')?.value;
  const monthLabel = monthPart
    ? `${monthPart.charAt(0).toUpperCase()}${monthPart.slice(1)}`
    : '';

  if (dayPart) {
    return `${dayPart} ${monthLabel} ${yearPart}`;
  }

  return `${monthLabel} ${yearPart}`;
}
