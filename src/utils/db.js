import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getUserFromDb(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}
