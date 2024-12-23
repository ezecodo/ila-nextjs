-- AlterTable
ALTER TABLE `Author` ADD COLUMN `personCategoryId` INTEGER NULL,
    MODIFY `role` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `PersonCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PersonCategory_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Author` ADD CONSTRAINT `Author_personCategoryId_fkey` FOREIGN KEY (`personCategoryId`) REFERENCES `PersonCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
