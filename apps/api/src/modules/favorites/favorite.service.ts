import { NotFoundError } from '../../domain/errors';
import { IndicatorRepository } from '../indicators/indicator.repository';
import { FavoriteRepository } from './favorite.repository';

export class FavoriteService {
  constructor(
    private readonly favorites: FavoriteRepository = new FavoriteRepository(),
    private readonly indicators: IndicatorRepository = new IndicatorRepository(),
  ) {}

  async list(clientId: string): Promise<string[]> {
    const rows = await this.favorites.listCodesFor(clientId);
    return rows.map((r) => r.indicator.code);
  }

  async add(clientId: string, code: string): Promise<void> {
    const indicator = await this.indicators.findByCode(code);
    if (!indicator) throw new NotFoundError(`Indicator '${code}' not found`);
    await this.favorites.add(clientId, indicator.id);
  }

  async remove(clientId: string, code: string): Promise<void> {
    const indicator = await this.indicators.findByCode(code);
    if (!indicator) throw new NotFoundError(`Indicator '${code}' not found`);
    await this.favorites.remove(clientId, indicator.id);
  }
}
