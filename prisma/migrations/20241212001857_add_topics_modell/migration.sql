-- CreateTable
CREATE TABLE `Topic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,

    UNIQUE INDEX `Topic_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArticleTopics` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArticleTopics_AB_unique`(`A`, `B`),
    INDEX `_ArticleTopics_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EditionTopics` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EditionTopics_AB_unique`(`A`, `B`),
    INDEX `_EditionTopics_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Topic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArticleTopics` ADD CONSTRAINT `_ArticleTopics_A_fkey` FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArticleTopics` ADD CONSTRAINT `_ArticleTopics_B_fkey` FOREIGN KEY (`B`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EditionTopics` ADD CONSTRAINT `_EditionTopics_A_fkey` FOREIGN KEY (`A`) REFERENCES `Edition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EditionTopics` ADD CONSTRAINT `_EditionTopics_B_fkey` FOREIGN KEY (`B`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
