import { formatVariation } from '../lib/format';

interface Props {
  percent: number | null;
  label: string;
}

export function VariationBadge({ percent, label }: Props) {
  const { label: text, tone } = formatVariation(percent);
  return (
    <p className={`variation variation--${tone}`}>
      <span>{text}</span>
      <span className="variation__window"> ({label})</span>
    </p>
  );
}
