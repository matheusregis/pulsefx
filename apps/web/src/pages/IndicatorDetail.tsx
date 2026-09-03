import { Link, useParams } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useIndicatorDetail } from '../hooks/useIndicatorDetail';
import { LineChart } from '../components/LineChart';
import { VariationBadge } from '../components/VariationBadge';
import { formatDate, formatValue } from '../lib/format';

export function IndicatorDetail() {
  const { code } = useParams<{ code: string }>();
  const { indicator, loading, error } = useIndicatorDetail(code);
  const { favorites, toggle } = useFavorites();

  if (loading) return <p>Carregando…</p>;
  if (error) return <p role="alert">Erro ao carregar indicador: {error}</p>;
  if (!indicator) return <p>Indicador não encontrado.</p>;

  const favorite = favorites.has(indicator.code);

  return (
    <section>
      <Link to="/">&larr; Voltar ao dashboard</Link>

      <header className="detail__header">
        <div>
          <span className={`badge badge--${indicator.source.toLowerCase()}`}>{indicator.source}</span>
          <h1>{indicator.name}</h1>
        </div>
        <button type="button" className="star-button" aria-pressed={favorite} onClick={() => toggle(indicator.code)}>
          {favorite ? '★ Favoritado' : '☆ Favoritar'}
        </button>
      </header>

      <p className="card__value">
        {indicator.latestValue !== null ? formatValue(indicator.latestValue, indicator.unit) : 'Sem dados'}
      </p>
      <p className="card__date">
        {indicator.referenceDate ? `Ref.: ${formatDate(indicator.referenceDate)}` : 'Aguardando primeira sincronização'}
      </p>
      <VariationBadge percent={indicator.variationPercent} label={indicator.variationLabel} />

      <h2>Histórico ({indicator.history.length} observações)</h2>
      <LineChart points={indicator.history} />

      <details>
        <summary>Ver tabela de observações</summary>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {[...indicator.history].reverse().map((point) => (
              <tr key={point.date}>
                <td>{formatDate(point.date)}</td>
                <td>{formatValue(point.value, indicator.unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <h2>Sobre este indicador</h2>
      <p>{indicator.description}</p>

      <h2>Limitações dos dados</h2>
      <p>{indicator.limitations}</p>
    </section>
  );
}
