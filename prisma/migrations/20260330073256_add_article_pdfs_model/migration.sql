/*
  Warnings:

  - You are about to drop the column `pdfUrl` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Article` DROP COLUMN `pdfUrl`;

-- CreateTable
CREATE TABLE `ArticlePdf` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `articleId` INTEGER NOT NULL,
    `url` TEXT NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ArticlePdf_articleId_idx`(`articleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArticlePdf` ADD CONSTRAINT `ArticlePdf_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
