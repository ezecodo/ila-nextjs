-- AlterTable
ALTER TABLE `Edition` ADD COLUMN `assignedAt` DATETIME(3) NULL,
    ADD COLUMN `needsReviewES` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `translationStatus` VARCHAR(191) NOT NULL DEFAULT 'not_assigned',
    ADD COLUMN `translatorId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Edition_translatorId_idx` ON `Edition`(`translatorId`);

-- AddForeignKey
ALTER TABLE `Edition` ADD CONSTRAINT `Edition_translatorId_fkey` FOREIGN KEY (`translatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
