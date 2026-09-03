import { prisma } from '../../infra/db/prisma';

/**
 * "Meus indicadores" persistence. Favorites are keyed by an anonymous
 * per-device `clientId` (see apps/web src/lib/clientId.ts) rather than a
 * user account — this MVP has no auth/accounts (out of scope, §8).
 */
export class FavoriteRepository {
  listCodesFor(clientId: string) {
    return prisma.favorite.findMany({
      where: { clientId },
      include: { indicator: { select: { code: true } } },
    });
  }

  add(clientId: string, indicatorId: string) {
    return prisma.favorite.upsert({
      where: { clientId_indicatorId: { clientId, indicatorId } },
      create: { clientId, indicatorId },
      update: {},
    });
  }

  async remove(clientId: string, indicatorId: string) {
    await prisma.favorite.deleteMany({ where: { clientId, indicatorId } });
  }
}
