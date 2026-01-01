/*
  Warnings:

  - Added the required column `subtitle` to the `banners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `banners` ADD COLUMN `subtitle` TEXT NOT NULL,
    ADD COLUMN `subtitleEs` TEXT NULL;
