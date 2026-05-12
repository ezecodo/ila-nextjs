-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `recipientId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `OrderRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
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

    INDEX `OrderRecipient_orderId_fkey`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `OrderItem_recipientId_fkey` ON `OrderItem`(`recipientId`);

-- AddForeignKey
ALTER TABLE `OrderRecipient` ADD CONSTRAINT `OrderRecipient_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `OrderRecipient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
