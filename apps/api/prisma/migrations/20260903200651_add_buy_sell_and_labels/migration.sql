-- AlterTable
ALTER TABLE "Indicator" ADD COLUMN     "secondaryValueLabel" TEXT,
ADD COLUMN     "valueLabel" TEXT NOT NULL DEFAULT 'Valor';

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "secondaryValue" DECIMAL(18,6);
