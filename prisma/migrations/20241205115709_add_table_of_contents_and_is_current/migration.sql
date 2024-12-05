-- AlterTable
ALTER TABLE `Edition` ADD COLUMN `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tableOfContents` TEXT NULL;
