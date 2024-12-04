/*
  Warnings:

  - Changed the type of `dateOfBirth` on the `ObituaryDetails` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `dateOfDeath` on the `ObituaryDetails` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE `ObituaryDetails` DROP COLUMN `dateOfBirth`,
    ADD COLUMN `dateOfBirth` INTEGER NOT NULL,
    DROP COLUMN `dateOfDeath`,
    ADD COLUMN `dateOfDeath` INTEGER NOT NULL;
