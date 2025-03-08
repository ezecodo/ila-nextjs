import { Resend } from "resend";

import dotenv from "dotenv";
dotenv.config(); // ✅ Cargar las variables de entorno

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email, token) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de", // 🚨 Asegúrate de que esta es una dirección válida del dominio verificado
      to: email, // El correo del usuario
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
