-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('user', 'admin', 'translator', 'reviewer', 'k2') NOT NULL DEFAULT 'user';
