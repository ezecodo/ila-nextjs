/*
  Warnings:

  - A unique constraint covering the columns `[drupalId]` on the table `Author` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Author` ADD COLUMN `drupalId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Author_drupalId_key` ON `Author`(`drupalId`);
