-- CreateTable
CREATE TABLE `BackupLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NULL,
    `destination` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
