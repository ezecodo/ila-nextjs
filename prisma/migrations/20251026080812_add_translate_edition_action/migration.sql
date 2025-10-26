-- AlterTable
ALTER TABLE `ActivityLog` ADD COLUMN `editionId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_editionId_fkey` FOREIGN KEY (`editionId`) REFERENCES `Edition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
