/*
  Warnings:

  - You are about to drop the column `altText` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `photographer` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `Image` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Image` DROP COLUMN `altText`,
    DROP COLUMN `description`,
    DROP COLUMN `photographer`,
    DROP COLUMN `source`,
    ADD COLUMN `alt` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NULL;
