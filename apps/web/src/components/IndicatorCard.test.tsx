import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { IndicatorCard } from './IndicatorCard';
import type { IndicatorCard as IndicatorCardData } from '../types';

const baseIndicator: IndicatorCardData = {
  code: 'USD-BRL-PTAX',
  name: 'Dólar (PTAX venda)',
  source: 'BCB',
  unit: 'BRL por USD',
  frequency: 'DAILY',
  variationLabel: 'D/D-1',
  lastSyncedAt: '2024-01-12T10:00:00.000Z',
  valueLabel: 'Venda',
  latestValue: 5.2,
  secondaryValueLabel: null,
  latestSecondaryValue: null,
  referenceDate: '2024-01-12',
  variationPercent: 4,
  variationUnavailableReason: null,
};

function renderCard(overrides: Partial<IndicatorCardData> = {}, favorite = false, onToggleFavorite = vi.fn()) {
  return render(
    <MemoryRouter>
      <IndicatorCard indicator={{ ...baseIndicator, ...overrides }} favorite={favorite} onToggleFavorite={onToggleFavorite} />
    </MemoryRouter>,
  );
}

describe('IndicatorCard', () => {
  it('shows the latest value, reference date and variation', () => {
    renderCard();

    expect(screen.getByText(/Dólar \(PTAX venda\)/)).toBeInTheDocument();
    expect(screen.getByText(/5,20 BRL por USD/)).toBeInTheDocument();
    expect(screen.getByText(/12\/01\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/\+4\.00%/)).toBeInTheDocument();
  });

  it('shows "Sem dados" when the indicator has no observations yet', () => {
    renderCard({ latestValue: null, referenceDate: null, variationPercent: null });

    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.getByText(/N\/D/)).toBeInTheDocument();
  });

  it('calls onToggleFavorite with the indicator code when the star is clicked', async () => {
    const onToggleFavorite = vi.fn();
    renderCard({}, false, onToggleFavorite);

    await userEvent.click(screen.getByRole('button', { name: /adicionar/i }));

    expect(onToggleFavorite).toHaveBeenCalledWith('USD-BRL-PTAX');
  });

  it('reflects favorite=true via aria-pressed and a filled star', () => {
    renderCard({}, true);

    const button = screen.getByRole('button', { name: /remover/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('★');
  });

  it('shows both buy and sell values when the indicator has a secondary value (e.g. PTAX)', () => {
    renderCard({ valueLabel: 'Venda', secondaryValueLabel: 'Compra', latestSecondaryValue: 5.18 });

    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText('Venda')).toBeInTheDocument();
    expect(screen.getByText(/5,18 BRL por USD/)).toBeInTheDocument();
    expect(screen.getByText(/5,20 BRL por USD/)).toBeInTheDocument();
  });
});
