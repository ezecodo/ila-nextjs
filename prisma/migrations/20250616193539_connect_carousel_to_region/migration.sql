/*
  Warnings:

  - You are about to drop the column `region` on the `Carousel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Carousel` DROP COLUMN `region`,
    ADD COLUMN `regionId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Carousel` ADD CONSTRAINT `Carousel_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
