-- CreateTable
CREATE TABLE `Interviewee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Interviewee_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArticleInterviewees` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArticleInterviewees_AB_unique`(`A`, `B`),
    INDEX `_ArticleInterviewees_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ArticleInterviewees` ADD CONSTRAINT `_ArticleInterviewees_A_fkey` FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArticleInterviewees` ADD CONSTRAINT `_ArticleInterviewees_B_fkey` FOREIGN KEY (`B`) REFERENCES `Interviewee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
