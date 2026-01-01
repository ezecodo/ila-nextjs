-- CreateTable
CREATE TABLE `banners` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `titleEs` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `descriptionEs` TEXT NULL,
    `buttonText` VARCHAR(191) NOT NULL,
    `buttonTextEs` VARCHAR(191) NULL,
    `buttonUrl` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `position` VARCHAR(191) NOT NULL DEFAULT 'top',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
