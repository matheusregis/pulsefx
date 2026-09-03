import { calculateVariation } from '../../domain/indicators/variation';
import { NotFoundError } from '../../domain/errors';
import { IndicatorRepository } from './indicator.repository';
import { toCardDTO, toSeriesPoints, type IndicatorCardDTO, type IndicatorDetailDTO } from './indicator.dto';

export class IndicatorService {
  constructor(private readonly repo: IndicatorRepository = new IndicatorRepository()) {}

  async listCards(): Promise<IndicatorCardDTO[]> {
    const indicators = await this.repo.findAll();
    return Promise.all(
      indicators.map(async (indicator) => {
        const observations = await this.repo.findObservations(indicator.id, indicator.variationWindow + 1);
        const points = toSeriesPoints(observations);
        const variation = points.length > 0 ? calculateVariation(points, indicator.variationWindow) : null;
        return toCardDTO(indicator, variation);
      }),
    );
  }

  async getDetail(code: string): Promise<IndicatorDetailDTO> {
    const indicator = await this.repo.findByCode(code);
    if (!indicator) throw new NotFoundError(`Indicator '${code}' not found`);

    const observations = await this.repo.findObservations(indicator.id, indicator.historyWindow);
    const pointsDesc = toSeriesPoints(observations);
    const variation = pointsDesc.length > 0 ? calculateVariation(pointsDesc, indicator.variationWindow) : null;

    return {
      ...toCardDTO(indicator, variation),
      description: indicator.description,
      limitations: indicator.limitations,
      historyWindow: indicator.historyWindow,
      history: [...pointsDesc].reverse(), // oldest -> newest, ready for charting
    };
  }
}
