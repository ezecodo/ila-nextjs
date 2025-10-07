-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `type` ENUM('NORMAL', 'NORMAL_PDF', 'SUPPORTER', 'REDUCED', 'TRIAL') NOT NULL,
    `format` ENUM('PRINT', 'PDF') NOT NULL,
    `donationExtra` DOUBLE NULL,
    `isGift` BOOLEAN NOT NULL DEFAULT false,
    `startYear` INTEGER NOT NULL DEFAULT 2025,
    `salutation` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `street` VARCHAR(191) NOT NULL,
    `addressExtra` VARCHAR(191) NULL,
    `zip` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `giftRecipientName` VARCHAR(191) NULL,
    `giftRecipientEmail` VARCHAR(191) NULL,
    `giftRecipientStreet` VARCHAR(191) NULL,
    `giftRecipientZip` VARCHAR(191) NULL,
    `giftRecipientCity` VARCHAR(191) NULL,
    `giftRecipientCountry` VARCHAR(191) NULL,
    `giftId` VARCHAR(191) NULL,
    `termsAccepted` BOOLEAN NOT NULL,
    `withdrawalAccepted` BOOLEAN NOT NULL,
    `dataConsentAccepted` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gift` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_giftId_fkey` FOREIGN KEY (`giftId`) REFERENCES `Gift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
