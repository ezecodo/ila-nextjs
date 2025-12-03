-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `promoGiftRecipientCity` VARCHAR(191) NULL,
    ADD COLUMN `promoGiftRecipientCountry` VARCHAR(191) NULL,
    ADD COLUMN `promoGiftRecipientEmail` VARCHAR(191) NULL,
    ADD COLUMN `promoGiftRecipientName` VARCHAR(191) NULL,
    ADD COLUMN `promoGiftRecipientStreet` VARCHAR(191) NULL,
    ADD COLUMN `promoGiftRecipientZip` VARCHAR(191) NULL;
