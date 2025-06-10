import { prisma } from "@/lib/prisma";

export async function getUserFromDb(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}
