import type { RangeOption } from '../lib/chartRange';

interface Props {
  options: RangeOption[];
  value: string;
  onChange: (key: string) => void;
}

export function RangeFilter({ options, value, onChange }: Props) {
  if (options.length <= 1) return null;

  return (
    <div className="range-filter" role="group" aria-label="Janela de histórico">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className="range-filter__btn"
          aria-pressed={option.key === value}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
