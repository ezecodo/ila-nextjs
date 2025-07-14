/*
  Warnings:

  - A unique constraint covering the columns `[legacyPath]` on the table `Article` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Article` ADD COLUMN `legacyPath` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Article_legacyPath_key` ON `Article`(`legacyPath`);
