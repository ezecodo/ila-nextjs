/*
  Warnings:

  - You are about to drop the `jahresregister` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `jahresregister`;

-- CreateTable
CREATE TABLE `annual_index` (
    `id` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `title` VARCHAR(191) NULL,
    `titleES` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploadedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `annual_index_year_key`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
