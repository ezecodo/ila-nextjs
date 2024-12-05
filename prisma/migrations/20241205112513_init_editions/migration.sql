/*
  Warnings:

  - You are about to drop the column `backgroundImage` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `datePublished` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `isCurrent` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `isDiscounted` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `isOrderable` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `tableOfContents` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Edition` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Edition` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Edition` DROP COLUMN `backgroundImage`,
    DROP COLUMN `coverImage`,
    DROP COLUMN `datePublished`,
    DROP COLUMN `isCurrent`,
    DROP COLUMN `isDiscounted`,
    DROP COLUMN `isOrderable`,
    DROP COLUMN `subtitle`,
    DROP COLUMN `summary`,
    DROP COLUMN `tableOfContents`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `year`;
