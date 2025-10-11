/*
  Warnings:

  - You are about to drop the column `giftDuration` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Subscription` DROP COLUMN `giftDuration`,
    ADD COLUMN `giftSubscriptionDuration` ENUM('ONE_YEAR', 'UNTIL_CANCELLED') NULL;
