"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import ArticleFormV2 from "../../components/ArticleFormV2";

const SUPER_ADMIN_EMAIL = "e.zeangeloni@gmail.com";

export default function EditArticleV2Page() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== SUPER_ADMIN_EMAIL) {
      router.replace(`/dashboard/articles/edit/${id}`);
    }
  }, [status, session, id, router]);

  if (status === "loading" || session?.user?.email !== SUPER_ADMIN_EMAIL) {
    return null;
  }

  return <ArticleFormV2 articleId={id} />;
}
