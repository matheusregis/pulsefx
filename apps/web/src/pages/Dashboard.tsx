import { useFavorites } from '../hooks/useFavorites';
import { useIndicators } from '../hooks/useIndicators';
import { IndicatorCard } from '../components/IndicatorCard';

interface Props {
  onlyFavorites?: boolean;
}

export function Dashboard({ onlyFavorites = false }: Props) {
  const { indicators, loading, error } = useIndicators();
  const { favorites, toggle } = useFavorites();

  if (loading) return <p className="state-message">Carregando indicadores…</p>;
  if (error) {
    return (
      <p className="state-message state-message--error" role="alert">
        Erro ao carregar indicadores: {error}
      </p>
    );
  }

  const visible = onlyFavorites ? indicators.filter((i) => favorites.has(i.code)) : indicators;

  return (
    <section>
      <div className="section-heading">
        <h1>{onlyFavorites ? 'Meus indicadores' : 'Dashboard'}</h1>
        <p className="section-heading__subtitle">
          {onlyFavorites
            ? 'Indicadores que você marcou com a estrela.'
            : 'Câmbio e indicadores macro a partir de dados públicos (BCB + FRED).'}
        </p>
      </div>

      {visible.length === 0 && onlyFavorites && (
        <p className="state-message">Nenhum indicador favoritado ainda. Marque um com a estrela no dashboard.</p>
      )}

      <div className="card-grid">
        {visible.map((indicator) => (
          <IndicatorCard
            key={indicator.code}
            indicator={indicator}
            favorite={favorites.has(indicator.code)}
            onToggleFavorite={toggle}
          />
        ))}
      </div>
    </section>
  );
}
