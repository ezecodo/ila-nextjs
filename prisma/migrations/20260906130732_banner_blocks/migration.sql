-- AlterTable
ALTER TABLE `banners` DROP COLUMN `eventDate`,
    DROP COLUMN `statShowArticles`,
    DROP COLUMN `statShowAuthors`,
    DROP COLUMN `statShowEditions`,
    DROP COLUMN `statShowTranslatedEs`,
    ADD COLUMN `blocks` JSON NULL;
