-- AlterTable
ALTER TABLE `Article` ADD COLUMN `reviewerId` VARCHAR(191) NULL,
    ADD COLUMN `translatorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('user', 'admin', 'translator', 'reviewer') NOT NULL DEFAULT 'user';

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_translatorId_fkey` FOREIGN KEY (`translatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
