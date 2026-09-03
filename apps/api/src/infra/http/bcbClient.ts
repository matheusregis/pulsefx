/**
 * BCB — Banco Central do Brasil.
 * Docs used:
 *  - Olinda / PTAX: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui3/
 *  - SGS (séries temporais): https://api.bcb.gov.br/dados/serie/bcdata.sgs.<codigo>/dados
 *    (portal de metadados/códigos: https://www3.bcb.gov.br/sgspub/)
 */

export interface RawPoint {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  value: number;
  /** Paired buy-side value, e.g. PTAX cotacaoCompra alongside `value` = cotacaoVenda. */
  secondaryValue?: number;
}

const PTAX_BASE = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata';
const SGS_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

function toOlindaDate(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${mm}-${dd}-${d.getUTCFullYear()}`;
}

function toSgsDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

interface PtaxRow {
  cotacaoVenda: number;
  cotacaoCompra: number;
  dataHoraCotacao: string; // "2024-01-12 13:07:33.123"
}

/**
 * USD/BRL PTAX — daily closing rate (dólar comercial). `CotacaoDolarPeriodo`
 * already returns a single (closing) quote per trading day, so no
 * boletim-type filter is needed. `value` = cotacaoVenda (sell, the
 * conventionally quoted PTAX rate) and `secondaryValue` = cotacaoCompra
 * (buy), both real BCB data — see README for why "dólar turismo" is not
 * included (BCB does not publish it; it's set per bank/exchange bureau).
 */
export async function fetchPtaxSeries(startDate: Date, endDate: Date): Promise<RawPoint[]> {
  const url =
    `${PTAX_BASE}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
    `?@dataInicial='${toOlindaDate(startDate)}'&@dataFinalCotacao='${toOlindaDate(endDate)}'` +
    `&$top=10000&$format=json&$select=cotacaoVenda,cotacaoCompra,dataHoraCotacao`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`BCB PTAX request failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { value: PtaxRow[] };

  return body.value.map((row) => ({
    date: row.dataHoraCotacao.slice(0, 10),
    value: row.cotacaoVenda,
    secondaryValue: row.cotacaoCompra,
  }));
}

interface SgsRow {
  data: string; // "DD/MM/YYYY"
  valor: string;
}

/**
 * BCB SGS time series (e.g. 432 = Meta Selic definida pelo Copom, % a.a.).
 */
export async function fetchSgsSeries(seriesCode: string, startDate: Date, endDate: Date): Promise<RawPoint[]> {
  const url =
    `${SGS_BASE}.${seriesCode}/dados?formato=json` +
    `&dataInicial=${toSgsDate(startDate)}&dataFinal=${toSgsDate(endDate)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`BCB SGS request failed (series ${seriesCode}): ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as SgsRow[];

  return body.map((row) => {
    const [dd, mm, yyyy] = row.data.split('/');
    return { date: `${yyyy}-${mm}-${dd}`, value: Number(row.valor) };
  });
}
