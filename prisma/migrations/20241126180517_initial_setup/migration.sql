-- CreateTable
CREATE TABLE `Article` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `beitragstypId` INTEGER NOT NULL,
    `beitragssubtypId` INTEGER NULL,
    `editionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Article_beitragssubtypId_fkey`(`beitragssubtypId`),
    INDEX `Article_beitragstypId_fkey`(`beitragstypId`),
    INDEX `Article_editionId_fkey`(`editionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Edition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `datePublished` DATETIME(3) NULL,

    UNIQUE INDEX `Edition_number_key`(`number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Beitragstyp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Beitragstyp_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Beitragssubtyp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `beitragstypId` INTEGER NOT NULL,

    UNIQUE INDEX `Beitragssubtyp_name_beitragstypId_key`(`name`, `beitragstypId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_beitragstypId_fkey` FOREIGN KEY (`beitragstypId`) REFERENCES `Beitragstyp`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_beitragssubtypId_fkey` FOREIGN KEY (`beitragssubtypId`) REFERENCES `Beitragssubtyp`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_editionId_fkey` FOREIGN KEY (`editionId`) REFERENCES `Edition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Beitragssubtyp` ADD CONSTRAINT `Beitragssubtyp_beitragstypId_fkey` FOREIGN KEY (`beitragstypId`) REFERENCES `Beitragstyp`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
