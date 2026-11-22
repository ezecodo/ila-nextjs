-- CreateTable
CREATE TABLE `InterletterRecipient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `languages` VARCHAR(191) NOT NULL DEFAULT 'de',
    `consentNote` TEXT NULL,
    `unsubscribeToken` VARCHAR(191) NOT NULL,
    `unsubscribedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InterletterRecipient_email_key`(`email`),
    UNIQUE INDEX `InterletterRecipient_unsubscribeToken_key`(`unsubscribeToken`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interletter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject` VARCHAR(500) NOT NULL,
    `content` JSON NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentByEmail` VARCHAR(191) NULL,
    `recipientCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InterletterDelivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `interletterId` INTEGER NOT NULL,
    `recipientId` INTEGER NOT NULL,
    `resendId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InterletterDelivery_interletterId_idx`(`interletterId`),
    INDEX `InterletterDelivery_recipientId_idx`(`recipientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InterletterDelivery` ADD CONSTRAINT `InterletterDelivery_interletterId_fkey` FOREIGN KEY (`interletterId`) REFERENCES `Interletter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterletterDelivery` ADD CONSTRAINT `InterletterDelivery_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `InterletterRecipient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

