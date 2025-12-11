-- CreateTable
CREATE TABLE `TocManualMatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `editionId` INTEGER NOT NULL,
    `tocTitle` VARCHAR(500) NOT NULL,
    `articleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NULL,

    INDEX `TocManualMatch_editionId_idx`(`editionId`),
    INDEX `TocManualMatch_articleId_idx`(`articleId`),
    UNIQUE INDEX `TocManualMatch_editionId_tocTitle_key`(`editionId`, `tocTitle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TocManualMatch` ADD CONSTRAINT `TocManualMatch_editionId_fkey` FOREIGN KEY (`editionId`) REFERENCES `Edition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TocManualMatch` ADD CONSTRAINT `TocManualMatch_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TocManualMatch` ADD CONSTRAINT `TocManualMatch_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
