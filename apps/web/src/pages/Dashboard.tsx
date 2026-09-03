import { useFavorites } from '../hooks/useFavorites';
import { useIndicators } from '../hooks/useIndicators';
import { IndicatorCard } from '../components/IndicatorCard';

interface Props {
  onlyFavorites?: boolean;
}

export function Dashboard({ onlyFavorites = false }: Props) {
  const { indicators, loading, error } = useIndicators();
  const { favorites, toggle } = useFavorites();

  if (loading) return <p>Carregando indicadores…</p>;
  if (error) return <p role="alert">Erro ao carregar indicadores: {error}</p>;

  const visible = onlyFavorites ? indicators.filter((i) => favorites.has(i.code)) : indicators;

  return (
    <section>
      <h1>{onlyFavorites ? 'Meus indicadores' : 'Dashboard'}</h1>
      {visible.length === 0 && onlyFavorites && (
        <p>Nenhum indicador favoritado ainda. Marque um com a estrela no dashboard.</p>
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
