import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config(); // ✅ Cargar las variables de entorno

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 📩 Enviar email de verificación de cuenta
 */
export async function sendVerificationEmail(email, token) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de", // 🚨 Asegúrate de que esta es una dirección válida del dominio verificado
      to: email,
      subject: "Verifica tu cuenta en ILA",
      html: `
          <h2>¡Bienvenido a ILA!</h2>
          <p>Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:</p>
          <a href="${confirmUrl}" target="_blank">Verificar cuenta</a>
        `,
    });

    console.log("✅ Correo enviado con éxito:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    throw new Error("No se pudo enviar el correo de verificación.");
  }
}

/**
 * 🔑 Enviar email para restablecer contraseña
 */
export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de", // 🚨 Misma dirección verificada
      to: email,
      subject: "Recupera tu contraseña en ILA",
      html: `
          <h2>Restablecer tu contraseña</h2>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Restablecer contraseña</a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        `,
    });

    console.log("✅ Correo de recuperación enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar correo de recuperación:", error);
    throw new Error("No se pudo enviar el correo de recuperación.");
  }
}

/**
 * 📩 Enviar email de invitación de admin
 */
export async function sendAdminInvitationEmail(email, token) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: email,
      subject: "Invitación para ser Administrador en ILA",
      html: `
          <h2>Has sido invitado como Administrador</h2>
          <p>Haz clic en el siguiente enlace para completar tu registro:</p>
          <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #ff4500; color: #fff; text-decoration: none; border-radius: 5px;">Aceptar invitación</a>
          <p>Este enlace expirará en 24 horas.</p>
        `,
    });

    console.log("✅ Invitación de admin enviada:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar invitación de admin:", error);
    throw new Error("No se pudo enviar la invitación.");
  }
}
