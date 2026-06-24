import { prisma } from "@/lib/prisma";

/**
 * ¿La sesión tiene los beneficios del Digital ABO (lectura de dossiers PDF y
 * artículos programados aún no publicados)?
 *
 * Lo tienen sin necesidad de invitación:
 *  - admins (para conocer/probar el producto)
 *  - traductores (beneficio por su trabajo)
 * Y los abonados, con invitación redimida y vigente.
 */
export async function hasAboAccess(session) {
  const role = session?.user?.role;
  if (role === "admin" || role === "translator") return true;

  const email = session?.user?.email;
  if (!email) return false;

  const invitation = await prisma.pdfAboInvitation.findUnique({
    where: { email: email.toLowerCase() },
    select: { isRedeemed: true, endDate: true },
  });

  return (
    !!invitation &&
    invitation.isRedeemed &&
    (!invitation.endDate || invitation.endDate > new Date())
  );
}
