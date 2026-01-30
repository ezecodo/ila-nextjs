-- CreateTable
CREATE TABLE `EditionPdf` (
    `id` VARCHAR(191) NOT NULL,
    `editionId` INTEGER NOT NULL,
    `pdfUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `pageCount` INTEGER NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EditionPdf_editionId_key`(`editionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PdfAboInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `isRedeemed` BOOLEAN NOT NULL DEFAULT false,
    `redeemedAt` DATETIME(3) NULL,
    `redeemedBy` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PdfAboInvitation_email_key`(`email`),
    UNIQUE INDEX `PdfAboInvitation_redeemedBy_key`(`redeemedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EditionPdf` ADD CONSTRAINT `EditionPdf_editionId_fkey` FOREIGN KEY (`editionId`) REFERENCES `Edition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PdfAboInvitation` ADD CONSTRAINT `PdfAboInvitation_redeemedBy_fkey` FOREIGN KEY (`redeemedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
