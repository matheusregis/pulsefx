import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Indicator catalog for Pulse FX. Rationale for each choice + the variation
 * rule per series type is documented in the root README (§ Séries
 * escolhidas / § Regra de variação). Keep this file and the README in sync.
 */
const indicators = [
  {
    code: 'USD-BRL-PTAX',
    name: 'Dólar (PTAX venda)',
    source: 'BCB' as const,
    sourceSeriesId: 'PTAX',
    unit: 'BRL por USD',
    frequency: 'DAILY' as const,
    variationWindow: 1,
    variationLabel: 'D/D-1 (dia útil anterior com cotação)',
    historyWindow: 90,
    description:
      'Taxa de câmbio de referência do mercado brasileiro (BCB Olinda/PTAX, endpoint CotacaoDolarPeriodo — uma ' +
      'cotação de fechamento por dia útil, venda). É a taxa mais usada como benchmark para conversão BRL/USD no ' +
      'Brasil, tornando-a o indicador central do Pulse FX.',
    limitations:
      'Publicada apenas em dias de pregão (sem sábados, domingos e feriados bancários); variação D/D-1 compara ' +
      'contra o último dia útil com cotação, sem interpolar dias sem pregão.',
  },
  {
    code: 'BR-SELIC-META',
    name: 'Selic — meta definida pelo Copom',
    source: 'BCB' as const,
    sourceSeriesId: '432',
    unit: '% a.a.',
    frequency: 'DAILY' as const,
    variationWindow: 1,
    variationLabel: 'D/D-1 (dia útil anterior)',
    historyWindow: 180,
    description:
      'Taxa básica de juros da economia brasileira (BCB SGS série 432), âncora para custo de capital, crédito e ' +
      'atratividade do BRL frente a outras moedas — contexto direto para quem acompanha câmbio.',
    limitations:
      'A série é publicada diariamente mas só muda de valor nas datas de decisão do Copom; variação D/D-1 é ' +
      'portanto 0% na maioria dos dias e não-zero apenas nos dias de reunião — não é interpolada nem suavizada.',
  },
  {
    code: 'US-FEDFUNDS',
    name: 'Fed Funds Rate (EUA)',
    source: 'FRED' as const,
    sourceSeriesId: 'FEDFUNDS',
    unit: '% a.a.',
    frequency: 'MONTHLY' as const,
    variationWindow: 1,
    variationLabel: 'M/M-1 (mês anterior)',
    historyWindow: 24,
    description:
      'Taxa efetiva de juros dos EUA (FRED, série FEDFUNDS, média mensal). Principal driver do diferencial de ' +
      'juros Brasil-EUA, um dos fatores mais citados para explicar movimentos do USD/BRL.',
    limitations:
      'Média mensal (não diária); comparação M/M-1 usa o mês anterior disponível, sem preencher meses sem dado.',
  },
  {
    code: 'US-CPI',
    name: 'CPI — Índice de Preços ao Consumidor (EUA)',
    source: 'FRED' as const,
    sourceSeriesId: 'CPIAUCSL',
    unit: 'Índice (1982-84=100)',
    frequency: 'MONTHLY' as const,
    variationWindow: 12,
    variationLabel: '12m (YoY)',
    historyWindow: 36,
    description:
      'Índice de inflação ao consumidor dos EUA (FRED, série CPIAUCSL). Inflação americana influencia a política ' +
      'do Fed e, por consequência, o diferencial de juros que move capital para/fora do Brasil.',
    limitations:
      'Variação calculada YoY (12 meses), convenção padrão para leitura de inflação — evita ruído sazonal de ' +
      'comparações mês a mês. Valores recentes podem sofrer revisão pela fonte.',
  },
];

async function main() {
  for (const indicator of indicators) {
    await prisma.indicator.upsert({
      where: { code: indicator.code },
      create: indicator,
      update: indicator,
    });
  }
  console.log(`Seeded ${indicators.length} indicators.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
