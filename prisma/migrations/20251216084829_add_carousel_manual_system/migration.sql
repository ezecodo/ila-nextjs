-- AlterTable
ALTER TABLE `Carousel` ADD COLUMN `isManual` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `CarouselArticle` (
    `id` VARCHAR(191) NOT NULL,
    `carouselId` VARCHAR(191) NOT NULL,
    `articleId` INTEGER NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CarouselArticle_carouselId_idx`(`carouselId`),
    INDEX `CarouselArticle_articleId_idx`(`articleId`),
    UNIQUE INDEX `CarouselArticle_carouselId_articleId_key`(`carouselId`, `articleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CarouselArticle` ADD CONSTRAINT `CarouselArticle_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarouselArticle` ADD CONSTRAINT `CarouselArticle_carouselId_fkey` FOREIGN KEY (`carouselId`) REFERENCES `Carousel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
