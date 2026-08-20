import axios from 'axios';
import { getDollarQuotes } from './olinda.service';

vi.mock('axios');

describe('getDollarQuotes', () => {
  it('should request the Olinda period endpoint and return quotes', async () => {
    const quotes = [
      {
        cotacaoCompra: 5.17,
        cotacaoVenda: 5.1714,
        dataHoraCotacao: '2026-08-19 13:07:22.062208',
      },
    ];

    vi.mocked(axios.get).mockResolvedValue({ data: { value: quotes } });

    const result = await getDollarQuotes(
      new Date(2026, 7, 11),
      new Date(2026, 7, 20),
    );

    expect(result).toEqual(quotes);
    expect(axios.get).toHaveBeenCalledWith(
      'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)',
      expect.objectContaining({
        params: {
          '@dataInicial': "'08-11-2026'",
          '@dataFinalCotacao': "'08-20-2026'",
          $format: 'json',
        },
      }),
    );
  });
});
