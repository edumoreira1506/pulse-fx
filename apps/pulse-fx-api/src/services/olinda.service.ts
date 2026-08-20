import axios from 'axios';

const OLINDA_ODATA_BASE =
  'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata';

const OLINDA_DOLLAR_PERIOD_URL = `${OLINDA_ODATA_BASE}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)`;

const OLINDA_CURRENCY_PERIOD_URL = `${OLINDA_ODATA_BASE}/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)`;

export interface PtaxQuote {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
  tipoBoletim?: string;
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
): Promise<PtaxQuote[]> {
  const { data } = await axios.get<{ value?: PtaxQuote[] }>(
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

export async function getCurrencyQuotes(
  currency: string,
  startDate: Date,
  endDate: Date,
): Promise<PtaxQuote[]> {
  const { data } = await axios.get<{ value?: PtaxQuote[] }>(
    OLINDA_CURRENCY_PERIOD_URL,
    {
      params: {
        '@moeda': `'${currency}'`,
        '@dataInicial': `'${formatOlindaDate(startDate)}'`,
        '@dataFinalCotacao': `'${formatOlindaDate(endDate)}'`,
        $format: 'json',
      },
      timeout: 10_000,
    },
  );

  // CotacaoMoedaPeriodo devolve vários boletins por dia; o fechamento é a PTAX oficial.
  return (data.value ?? []).filter((quote) => quote.tipoBoletim === 'Fechamento');
}
