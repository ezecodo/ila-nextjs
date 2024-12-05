/*
  Warnings:

  - Made the column `datePublished` on table `Edition` required. This step will fail if there are existing NULL values in that column.
  - Made the column `backgroundImage` on table `Edition` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coverImage` on table `Edition` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tableOfContents` on table `Edition` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Edition` MODIFY `datePublished` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `backgroundImage` VARCHAR(191) NOT NULL,
    MODIFY `coverImage` VARCHAR(191) NOT NULL,
    MODIFY `tableOfContents` TEXT NOT NULL;
