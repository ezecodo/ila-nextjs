-- CreateTable
CREATE TABLE `ObituaryDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `articleId` INTEGER NOT NULL,
    `deceasedFirstName` VARCHAR(191) NOT NULL,
    `deceasedLastName` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `dateOfDeath` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ObituaryDetails_articleId_key`(`articleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ObituaryDetails` ADD CONSTRAINT `ObituaryDetails_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
