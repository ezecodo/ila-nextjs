-- AlterTable
ALTER TABLE `Edition` ADD COLUMN `isTranslatedES` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `subtitleES` VARCHAR(191) NULL,
    ADD COLUMN `summaryES` TEXT NULL,
    ADD COLUMN `tableOfContentsES` TEXT NULL;
