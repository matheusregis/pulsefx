import { Link } from 'react-router-dom';
import { formatDate, formatValue } from '../lib/format';
import type { IndicatorCard as IndicatorCardData } from '../types';
import { VariationBadge } from './VariationBadge';

interface Props {
  indicator: IndicatorCardData;
  favorite: boolean;
  onToggleFavorite: (code: string) => void;
}

export function IndicatorCard({ indicator, favorite, onToggleFavorite }: Props) {
  const {
    code,
    name,
    source,
    latestValue,
    valueLabel,
    latestSecondaryValue,
    secondaryValueLabel,
    unit,
    referenceDate,
    variationPercent,
    variationLabel,
  } = indicator;
  const hasSecondary = secondaryValueLabel !== null && latestSecondaryValue !== null;

  return (
    <article className="card" data-testid={`indicator-card-${code}`}>
      <header className="card__header">
        <span className={`badge badge--${source.toLowerCase()}`}>{source}</span>
        <button
          type="button"
          className="star-button"
          aria-pressed={favorite}
          aria-label={favorite ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`}
          onClick={() => onToggleFavorite(code)}
        >
          {favorite ? '★' : '☆'}
        </button>
      </header>

      <Link to={`/indicadores/${code}`} className="card__body">
        <h3>{name}</h3>

        {hasSecondary ? (
          <div className="card__dual-value">
            <div>
              <span className="card__dual-label">{secondaryValueLabel}</span>
              <span className="card__dual-amount">{formatValue(latestSecondaryValue as number, unit)}</span>
            </div>
            <div>
              <span className="card__dual-label">{valueLabel}</span>
              <span className="card__dual-amount card__dual-amount--primary">
                {latestValue !== null ? formatValue(latestValue, unit) : 'Sem dados'}
              </span>
            </div>
          </div>
        ) : (
          <p className="card__value">{latestValue !== null ? formatValue(latestValue, unit) : 'Sem dados'}</p>
        )}

        <p className="card__date">
          {referenceDate ? `Ref.: ${formatDate(referenceDate)}` : 'Aguardando primeira sincronização'}
        </p>
        <VariationBadge percent={variationPercent} label={variationLabel} />
      </Link>
    </article>
  );
}
