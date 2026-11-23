-- AlterTable
ALTER TABLE `Interletter` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedByEmail` VARCHAR(191) NULL,
    MODIFY `sentAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Interletter_status_idx` ON `Interletter`(`status`);


-- Envíos existentes: fechas reales en vez de "ahora"
UPDATE `Interletter` SET `createdAt` = `sentAt`, `updatedAt` = `sentAt` WHERE `sentAt` IS NOT NULL;
