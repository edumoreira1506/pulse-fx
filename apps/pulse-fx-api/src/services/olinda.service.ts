import axios from 'axios';

const OLINDA_DOLLAR_PERIOD_URL =
  'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)';

export interface DollarQuote {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
}

function formatOlindaDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${month}-${day}-${year}`;
}

export async function getDollarQuotes(
  startDate: Date,
  endDate: Date,
): Promise<DollarQuote[]> {
  const { data } = await axios.get<{ value?: DollarQuote[] }>(
    OLINDA_DOLLAR_PERIOD_URL,
    {
      params: {
        '@dataInicial': `'${formatOlindaDate(startDate)}'`,
        '@dataFinalCotacao': `'${formatOlindaDate(endDate)}'`,
        $format: 'json',
      },
      timeout: 10_000,
    },
  );

  return data.value ?? [];
}
