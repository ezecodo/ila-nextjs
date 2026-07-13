-- AlterTable
ALTER TABLE `Article` ADD COLUMN `originalContent` LONGTEXT NULL,
    ADD COLUMN `originalLanguage` VARCHAR(191) NULL,
    ADD COLUMN `originalPreviewText` LONGTEXT NULL,
    ADD COLUMN `originalSubtitle` VARCHAR(191) NULL,
    ADD COLUMN `originalTitle` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Image` ADD COLUMN `originalAlt` VARCHAR(191) NULL,
    ADD COLUMN `originalTitle` VARCHAR(750) NULL;
