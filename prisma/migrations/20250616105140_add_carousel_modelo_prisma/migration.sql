-- CreateTable
CREATE TABLE `Carousel` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `beitragstypId` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NULL,
    `region` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `limit` INTEGER NOT NULL DEFAULT 10,
    `orderBy` VARCHAR(191) NOT NULL DEFAULT 'date_desc',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
