-- AlterTable
ALTER TABLE `Edition` ADD COLUMN `isPublished` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `publishedAt` DATETIME(3) NULL;
