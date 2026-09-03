import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useIndicatorDetail } from '../hooks/useIndicatorDetail';
import { PriceChart } from '../components/PriceChart';
import { RangeFilter } from '../components/RangeFilter';
import { VariationBadge } from '../components/VariationBadge';
import { buildRangeOptions, defaultRangeKey, filterHistory } from '../lib/chartRange';
import { formatDate, formatValue } from '../lib/format';

export function IndicatorDetail() {
  const { code } = useParams<{ code: string }>();
  const { indicator, loading, error } = useIndicatorDetail(code);
  const { favorites, toggle } = useFavorites();
  const [rangeKey, setRangeKey] = useState<string | null>(null);

  const rangeOptions = useMemo(
    () => (indicator ? buildRangeOptions(indicator.frequency, indicator.history.length) : []),
    [indicator],
  );
  const activeRangeKey = rangeKey ?? defaultRangeKey(rangeOptions);
  const activeOption = rangeOptions.find((o) => o.key === activeRangeKey) ?? rangeOptions.at(-1);
  const visibleHistory = indicator ? filterHistory(indicator.history, activeOption?.points ?? indicator.history.length) : [];

  if (loading) return <p className="state-message">Carregando…</p>;
  if (error) return (
    <p className="state-message state-message--error" role="alert">
      Erro ao carregar indicador: {error}
    </p>
  );
  if (!indicator) return <p className="state-message">Indicador não encontrado.</p>;

  const favorite = favorites.has(indicator.code);
  const hasSecondary = indicator.secondaryValueLabel !== null && indicator.latestSecondaryValue !== null;

  return (
    <section className="detail">
      <Link to="/" className="detail__back">
        &larr; Voltar ao dashboard
      </Link>

      <header className="detail__header">
        <div className="detail__title">
          <span className={`badge badge--${indicator.source.toLowerCase()}`}>{indicator.source}</span>
          <h1>{indicator.name}</h1>
        </div>
        <button
          type="button"
          className="star-button star-button--labelled"
          aria-pressed={favorite}
          onClick={() => toggle(indicator.code)}
        >
          {favorite ? '★ Favoritado' : '☆ Favoritar'}
        </button>
      </header>

      <div className="detail__values">
        <div className="detail__value-block">
          {hasSecondary && <span className="detail__value-label">{indicator.valueLabel}</span>}
          <span className="detail__value-primary">
            {indicator.latestValue !== null ? formatValue(indicator.latestValue, indicator.unit) : 'Sem dados'}
          </span>
        </div>
        {hasSecondary && (
          <div className="detail__value-block detail__value-block--secondary">
            <span className="detail__value-label">{indicator.secondaryValueLabel}</span>
            <span className="detail__value-secondary">
              {formatValue(indicator.latestSecondaryValue as number, indicator.unit)}
            </span>
          </div>
        )}
      </div>

      <p className="card__date">
        {indicator.referenceDate ? `Ref.: ${formatDate(indicator.referenceDate)}` : 'Aguardando primeira sincronização'}
      </p>
      <VariationBadge percent={indicator.variationPercent} label={indicator.variationLabel} />

      <div className="detail__chart-section">
        <div className="detail__chart-header">
          <h2>Histórico</h2>
          <RangeFilter options={rangeOptions} value={activeRangeKey} onChange={setRangeKey} />
        </div>
        <PriceChart points={visibleHistory} unit={indicator.unit} />
      </div>

      <details className="detail__table">
        <summary>Ver tabela de observações ({visibleHistory.length})</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>{hasSecondary ? indicator.valueLabel : 'Valor'}</th>
                {hasSecondary && <th>{indicator.secondaryValueLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {[...visibleHistory].reverse().map((point) => (
                <tr key={point.date}>
                  <td>{formatDate(point.date)}</td>
                  <td>{formatValue(point.value, indicator.unit)}</td>
                  {hasSecondary && (
                    <td>{point.secondaryValue !== undefined ? formatValue(point.secondaryValue, indicator.unit) : '—'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <h2>Sobre este indicador</h2>
      <p>{indicator.description}</p>

      <h2>Limitações dos dados</h2>
      <p>{indicator.limitations}</p>
    </section>
  );
}
