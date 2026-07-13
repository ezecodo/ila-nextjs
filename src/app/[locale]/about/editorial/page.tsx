// app/[locale]/about/editorial/page.tsx
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import type { RedaktionMember } from "@prisma/client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EditorialPage({ params }: Props) {
  const { locale } = await params;

  const members = await prisma.redaktionMember.findMany({
    orderBy: { order: "asc" },
  });

  const title = locale === "es" ? "La Redacción" : "Die Redaktion";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-[#BD0E0D] mb-8">{title}</h1>

      <div className="space-y-6">
        {members.map((member: RedaktionMember) => {
          const bio =
            locale === "es" ? member.bioES || member.bio : member.bio;

          return (
            <p
              key={member.id}
              className="text-lg leading-relaxed text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-6 last:border-none last:pb-0"
            >
              {member.photoUrl && (
                <Image
                  src={member.photoUrl}
                  alt={member.name}
                  width={40}
                  height={40}
                  className="inline-block w-10 h-10 rounded-full object-cover align-middle mr-3 -mt-1"
                />
              )}
              <strong className="text-[#BD0E0D]">{member.name}</strong>
              {bio ? ` ${bio}` : ""}
            </p>
          );
        })}
      </div>
    </div>
  );
}
