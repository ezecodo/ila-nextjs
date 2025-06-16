/*
  Warnings:

  - You are about to alter the column `beitragstypId` on the `Carousel` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `Carousel` MODIFY `beitragstypId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Carousel` ADD CONSTRAINT `Carousel_beitragstypId_fkey` FOREIGN KEY (`beitragstypId`) REFERENCES `Beitragstyp`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
