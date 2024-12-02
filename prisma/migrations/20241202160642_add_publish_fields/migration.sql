-- AlterTable
ALTER TABLE `Article` ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `publicationDate` DATETIME(3) NULL;
