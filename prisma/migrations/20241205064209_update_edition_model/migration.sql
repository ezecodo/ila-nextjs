/*
  Warnings:

  - Added the required column `summary` to the `Edition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Edition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Edition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Edition` ADD COLUMN `backgroundImage` VARCHAR(191) NULL,
    ADD COLUMN `coverImage` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isDiscounted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isOrderable` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `subtitle` VARCHAR(191) NULL,
    ADD COLUMN `summary` TEXT NOT NULL,
    ADD COLUMN `tableOfContents` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `year` INTEGER NOT NULL;
