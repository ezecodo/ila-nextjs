-- AlterTable
ALTER TABLE `Link` ADD COLUMN `editionCoverImage` VARCHAR(191) NULL,
    ADD COLUMN `editionNumber` INTEGER NULL,
    ADD COLUMN `linkType` VARCHAR(191) NOT NULL DEFAULT 'general';
