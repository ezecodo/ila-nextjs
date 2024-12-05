/*
  Warnings:

  - Added the required column `summary` to the `Edition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Edition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Edition` ADD COLUMN `summary` TEXT NOT NULL,
    ADD COLUMN `year` INTEGER NOT NULL;
