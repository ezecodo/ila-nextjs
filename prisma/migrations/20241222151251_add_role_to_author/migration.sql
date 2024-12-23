/*
  Warnings:

  - Added the required column `role` to the `Author` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Author` ADD COLUMN `bio` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `_AuthorRegions` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AuthorRegions_AB_unique`(`A`, `B`),
    INDEX `_AuthorRegions_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AuthorTopics` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AuthorTopics_AB_unique`(`A`, `B`),
    INDEX `_AuthorTopics_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_AuthorRegions` ADD CONSTRAINT `_AuthorRegions_A_fkey` FOREIGN KEY (`A`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AuthorRegions` ADD CONSTRAINT `_AuthorRegions_B_fkey` FOREIGN KEY (`B`) REFERENCES `Region`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AuthorTopics` ADD CONSTRAINT `_AuthorTopics_A_fkey` FOREIGN KEY (`A`) REFERENCES `Author`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AuthorTopics` ADD CONSTRAINT `_AuthorTopics_B_fkey` FOREIGN KEY (`B`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
