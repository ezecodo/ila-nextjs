-- AlterTable
ALTER TABLE `ActivityLog` ADD COLUMN `carouselId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ActivityLog_carouselId_idx` ON `ActivityLog`(`carouselId`);
