/*
  Warnings:

  - You are about to drop the column `category` on the `Carousel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Carousel` DROP COLUMN `category`;

-- CreateTable
CREATE TABLE `_CarouselCategories` (
    `A` VARCHAR(191) NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CarouselCategories_AB_unique`(`A`, `B`),
    INDEX `_CarouselCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_CarouselCategories` ADD CONSTRAINT `_CarouselCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `Carousel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CarouselCategories` ADD CONSTRAINT `_CarouselCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
