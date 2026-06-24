import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import { sendTranslatorAssignmentEmail } from "@/lib/email";

export async function PUT(req, context) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { params } = context;
  const articleId = Number(params.id);
  const { translatorId } = await req.json(); // puede ser string o null

  try {
    // 📌 Traductor actual: si se reasigna a la misma persona, no reenviamos email.
    const previous = await prisma.article.findUnique({
      where: { id: articleId },
      select: { translatorId: true },
    });

    let data = {
      assignedAt: translatorId ? new Date() : null,
      translationStatus: translatorId ? "in_progress" : null,
    };

    // 👇 si viene translatorId => asignar/reasignar
    // 👇 si viene null => desasignar
    if (translatorId) {
      data.translator = { connect: { id: translatorId } };
    } else {
      data.translator = { disconnect: true };
      data.reviewer = { disconnect: true };
    }

    // ✅ solo guardamos reviewer si el que asigna es admin o reviewer
    if (["admin", "reviewer"].includes(session.user.role)) {
      data.reviewer = { connect: { id: session.user.id } };
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data,
      include: {
        translator: { select: { id: true, name: true, email: true } },
        edition: { select: { number: true } },
      },
    });

    // ✉️ Avisar al traductor solo si es una asignación nueva (persona distinta)
    const isNewAssignment =
      translatorId && translatorId !== previous?.translatorId;
    if (isNewAssignment && article.translator?.email) {
      try {
        await sendTranslatorAssignmentEmail(
          article.translator.email,
          article.translator.name,
          {
            articleTitle: article.title,
            editionNumber: article.edition?.number ?? null,
          }
        );
      } catch (mailError) {
        // El email no debe tumbar la asignación; ya quedó guardada.
        console.error("⚠️ Asignación guardada pero falló el email:", mailError);
      }
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error asignando/desasignando traductor:", error);
    return NextResponse.json(
      { message: "Error asignando/desasignando traductor" },
      { status: 500 }
    );
  }
}
