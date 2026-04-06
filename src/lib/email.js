import { Resend } from "resend";
import dotenv from "dotenv";
import * as Sentry from "@sentry/nextjs";

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
      subject: "Verifica tu cuenta en ila",
      html: `
          <h2>¡Bienvenido a ila</h2>
          <p>Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:</p>
          <a href="${confirmUrl}" target="_blank">Verificar cuenta</a>
        `,
    });

    console.log("✅ Correo enviado con éxito:", response);
    return response;
  } catch (error) {
    Sentry.captureException(error);
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
      subject: "Recupera tu contraseña en ila",
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
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?inviteToken=${token}`;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: email,
      subject: "Invitación para ser Administrador en ila",
      html: `
            <h2>Te han invitado como Administrador en ila</h2>
            <p>Haz clic en el siguiente enlace para registrarte como Administrador:</p>
            <a href="${inviteUrl}" target="_blank" 
               style="display: inline-block; padding: 10px 20px; background-color: #007bff; 
               color: #fff; text-decoration: none; border-radius: 5px;">
               Aceptar invitación
            </a>
            <p>Este enlace expirará en 24 horas.</p>
          `,
    });

    console.log("✅ Correo de invitación enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar la invitación:", error);
    throw new Error("No se pudo enviar la invitación.");
  }
}

/**
 * 📬 Enviar email de confirmación de suscripción
 */
export async function sendSubscriptionConfirmationEmail(subscription) {
  const isGerman =
    subscription.country === "Deutschland" ||
    (subscription.email && subscription.email.endsWith(".de"));

  const subject = isGerman
    ? "Danke für dein ila-Abo"
    : "Gracias por tu suscripción a ila";

  const html = isGerman
    ? `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width:600px; margin:auto;">
      <h2 style="color:#c21f2e;">Danke für dein ila-Abo!</h2>
      <p>Hallo <strong>${subscription.firstName} ${subscription.lastName}</strong>,</p>
      <p>wir haben deine Bestellung erhalten. In Kürze wird sich jemand aus unserem Team mit dir in Verbindung setzen.</p>

      <h3 style="margin-top:25px;">📰 Abo-Details</h3>
      <ul style="padding-left:18px;">
        <li><strong>Typ:</strong> ${subscription.type}</li>
        <li><strong>Format:</strong> ${subscription.format}</li>
        ${subscription.gift ? `<li><strong>Prämie:</strong> ${subscription.gift.name}</li>` : ""}
      </ul>

    <h3 style="margin-top:25px;">📍 Adresse</h3>
      <p>
        ${subscription.street}<br>
        ${subscription.zip} ${subscription.city}<br>
        ${subscription.country}
      </p>

      ${
        subscription.isGift && subscription.giftRecipientName
          ? `
      <div style="margin-top:30px;padding:20px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:5px;">
        <h3 style="color:#3b82f6;margin-top:0;">🎁 Geschenkempfänger des Abos</h3>
        <p style="margin-bottom:5px;">Du hast dieses Abo verschenkt an:</p>
        <p style="margin:0;padding-left:15px;">
          ${subscription.giftRecipientName}<br>
          ${subscription.giftRecipientEmail ? `${subscription.giftRecipientEmail}<br>` : ""}
          ${subscription.giftRecipientStreet}<br>
          ${subscription.giftRecipientZip} ${subscription.giftRecipientCity}<br>
          ${subscription.giftRecipientCountry}
        </p>
        <p style="margin-top:10px;font-size:14px;color:#666;">
          Dauer: ${subscription.giftSubscriptionDuration === "ONE_YEAR" ? "1 Jahr" : "Bis zur Kündigung"}
        </p>
      </div>
      `
          : ""
      }

      ${
        subscription.promoGiftRecipientName
          ? `
      <div style="margin-top:30px;padding:20px;background:#fff5f5;border-left:4px solid #c21f2e;border-radius:5px;">
        <h3 style="color:#c21f2e;margin-top:0;">🎁 Dein Geschenk-Abo (Promo Dezember 2025)</h3>
        <p style="margin-bottom:10px;">Als Dankeschön für dein Abo schenken wir dir ein <strong>3-monatiges Probe-Abo</strong> zum Weiterverschenken!</p>
        
        <p style="margin-bottom:5px;"><strong>Empfänger des Geschenk-Abos:</strong></p>
        <p style="margin:0;padding-left:15px;">
          ${subscription.promoGiftRecipientName}<br>
          ${subscription.promoGiftRecipientEmail ? `${subscription.promoGiftRecipientEmail}<br>` : ""}
          ${subscription.promoGiftRecipientStreet}<br>
          ${subscription.promoGiftRecipientZip} ${subscription.promoGiftRecipientCity}<br>
          ${subscription.promoGiftRecipientCountry}
        </p>
        
        <p style="margin-top:15px;font-size:14px;color:#666;">
          ℹ️ Das Probe-Abo läuft 3 Monate und endet automatisch.
        </p>
      </div>
      `
          : ""
      }

      <p style="margin-top:30px;">Herzliche Grüße,<br>das ila-Team<br>
      <a href="https://ila-web.de" style="color:#c21f2e;text-decoration:none;">ila-web.de</a></p>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width:600px; margin:auto;">
      <h2 style="color:#c21f2e;">¡Gracias por tu suscripción a ila!</h2>
      <p>Hola <strong>${subscription.firstName} ${subscription.lastName}</strong>,</p>
      <p>Hemos recibido correctamente tu suscripción a la revista <strong>ila</strong>. En breve alguien de nuestro equipo se pondrá en contacto contigo para confirmar los detalles.</p>

      <h3 style="margin-top:25px;">📰 Detalles de tu suscripción</h3>
      <ul style="padding-left:18px;">
        <li><strong>Tipo:</strong> ${subscription.type}</li>
        <li><strong>Formato:</strong> ${subscription.format}</li>
        ${subscription.gift ? `<li><strong>Regalo:</strong> ${subscription.gift.name}</li>` : ""}
      </ul>

   <h3 style="margin-top:25px;">📍 Dirección</h3>
      <p>
        ${subscription.street}<br>
        ${subscription.zip} ${subscription.city}<br>
        ${subscription.country}
      </p>

      ${
        subscription.isGift && subscription.giftRecipientName
          ? `
      <div style="margin-top:30px;padding:20px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:5px;">
        <h3 style="color:#3b82f6;margin-top:0;">🎁 Destinatario del Abo (Regalo)</h3>
        <p style="margin-bottom:5px;">Has elegido regalar este Abo a:</p>
        <p style="margin:0;padding-left:15px;">
          ${subscription.giftRecipientName}<br>
          ${subscription.giftRecipientEmail ? `${subscription.giftRecipientEmail}<br>` : ""}
          ${subscription.giftRecipientStreet}<br>
          ${subscription.giftRecipientZip} ${subscription.giftRecipientCity}<br>
          ${subscription.giftRecipientCountry}
        </p>
        <p style="margin-top:10px;font-size:14px;color:#666;">
          Duración: ${subscription.giftSubscriptionDuration === "ONE_YEAR" ? "1 año" : "Hasta cancelación"}
        </p>
      </div>
      `
          : ""
      }

      ${
        subscription.promoGiftRecipientName
          ? `
      <div style="margin-top:30px;padding:20px;background:#fff5f5;border-left:4px solid #c21f2e;border-radius:5px;">
        <h3 style="color:#c21f2e;margin-top:0;">🎁 Tu Abo de regalo (Promo Diciembre 2025)</h3>
        <p style="margin-bottom:10px;">¡Como agradecimiento por tu suscripción, te regalamos un <strong>Abo de prueba de 3 meses</strong> para que lo obsequies!</p>
        
        <p style="margin-bottom:5px;"><strong>Destinatario del Abo de regalo:</strong></p>
        <p style="margin:0;padding-left:15px;">
          ${subscription.promoGiftRecipientName}<br>
          ${subscription.promoGiftRecipientEmail ? `${subscription.promoGiftRecipientEmail}<br>` : ""}
          ${subscription.promoGiftRecipientStreet}<br>
          ${subscription.promoGiftRecipientZip} ${subscription.promoGiftRecipientCity}<br>
          ${subscription.promoGiftRecipientCountry}
        </p>
        
        <p style="margin-top:15px;font-size:14px;color:#666;">
          ℹ️ El Abo de prueba dura 3 meses y finaliza automáticamente.
        </p>
      </div>
      `
          : ""
      }

      <p style="margin-top:30px;">Un cordial saludo,<br>El equipo de ila<br>
      <a href="https://ila-web.de" style="color:#c21f2e;text-decoration:none;">ila-web.de</a></p>
    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: subscription.email,
      subject,
      html,
    });

    console.log("✅ Correo de confirmación de suscripción enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar correo de suscripción:", error);
  }
}

/**
 * 📬 Enviar email de confirmación de pedido de Dossiers (con mensaje del usuario)
 */
export async function sendDossierOrderConfirmationEmail(order, locale = "de") {
  const isGerman = locale === "de";

  const subject = isGerman
    ? "Danke für deine ila-Bestellung"
    : "Gracias por tu pedido de Dossiers de ila";

  // 🧾 Obtenemos el pedido completo con ediciones
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: { edition: true },
      },
    },
  });

  // 🗂️ Lista de items
  const itemsList = fullOrder.items
    .map(
      (item) =>
        `<li>${item.qty} × <strong>ila ${item.edition.number}</strong> – ${item.edition.title}</li>`,
    )
    .join("");

  // 💬 Mensaje del usuario (opcional)
  const userMessage = fullOrder.message
    ? `<blockquote style="margin:15px 0;padding:10px 15px;border-left:4px solid #c21f2e;background:#f9f9f9;color:#333;">
        ${fullOrder.message}
      </blockquote>`
    : "";

  // 📨 HTML del correo
  const html = isGerman
    ? `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:auto;">
        <h2 style="color:#c21f2e;">Danke für deine Bestellung!</h2>
        <p>Hallo <strong>${fullOrder.firstName} ${fullOrder.lastName}</strong>,</p>
        <p>wir haben deine Bestellung erhalten. In Kürze wird sich jemand aus unserem Team mit dir in Verbindung setzen.</p>

        <h3 style="margin-top:25px;">🧾 Bestellübersicht</h3>
        <ul style="padding-left:18px;">${itemsList}</ul>

        ${
          fullOrder.totalPrice
            ? `<p><strong>Gesamtbetrag:</strong> ${fullOrder.totalPrice} €</p>`
            : ""
        }

        ${
          userMessage
            ? `<h3 style="margin-top:25px;">💬 Nachricht des Bestellers</h3>${userMessage}`
            : ""
        }

        <h3 style="margin-top:25px;">📍 Lieferadresse</h3>
        <p>
          ${fullOrder.street}<br>
          ${fullOrder.zip} ${fullOrder.city}<br>
          ${fullOrder.country}
        </p>

        <p style="margin-top:30px;">Herzliche Grüße,<br>das ila-Team<br>
        <a href="https://ila-web.de" style="color:#c21f2e;text-decoration:none;">ila-web.de</a></p>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:auto;">
        <h2 style="color:#c21f2e;">¡Gracias por tu pedido de Dossiers!</h2>
        <p>Hola <strong>${fullOrder.firstName} ${fullOrder.lastName}</strong>,</p>
        <p>Hemos recibido correctamente tu pedido. En breve alguien de nuestro equipo se pondrá en contacto contigo.</p>

        <h3 style="margin-top:25px;">🧾 Resumen de tu pedido</h3>
        <ul style="padding-left:18px;">${itemsList}</ul>

        ${
          fullOrder.totalPrice
            ? `<p><strong>Total:</strong> ${fullOrder.totalPrice} €</p>`
            : ""
        }

        ${
          userMessage
            ? `<h3 style="margin-top:25px;">💬 Mensaje de quien realizó el pedido</h3>${userMessage}`
            : ""
        }

        <h3 style="margin-top:25px;">📍 Dirección de envío</h3>
        <p>
          ${fullOrder.street}<br>
          ${fullOrder.zip} ${fullOrder.city}<br>
          ${fullOrder.country}
        </p>

        <p style="margin-top:30px;">Un cordial saludo,<br>El equipo de ila<br>
        <a href="https://ila-web.de" style="color:#c21f2e;text-decoration:none;">ila-web.de</a></p>
      </div>
    `;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: order.email,
      subject,
      html,
    });
    console.log("✅ Correo de confirmación de pedido enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar correo de pedido:", error);
  }
}

/**
 * 📩 Enviar email de invitación PDF ABO
 */
export async function sendPdfAboInvitationEmail(email) {
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?pdfAbo=true`;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: email,
      subject: "Dein PDF-Abo bei ila ist bereit!",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
          <h2 style="color: #c21f2e;">Willkommen bei ila!</h2>
          
          <p>Hallo,</p>
          
          <p>Dein <strong>PDF-Abo</strong> der Zeitschrift <strong>ila</strong> ist jetzt verfügbar!</p>
          
          <p>Um Zugang zu deinen PDF-Ausgaben zu erhalten, registriere dich bitte mit dieser E-Mail-Adresse:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registerUrl}" 
               target="_blank" 
               style="display: inline-block; padding: 15px 30px; background-color: #c21f2e; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Jetzt registrieren
            </a>
          </div>
          
          <p>Nach der Registrierung findest du alle verfügbaren Ausgaben in deinem persönlichen Dashboard unter <strong>"Meine Dossiers"</strong>.</p>
          
          <p style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 5px; font-size: 14px;">
            <strong>Wichtig:</strong> Bitte registriere dich mit genau dieser E-Mail-Adresse (${email}), damit dein Abo automatisch aktiviert wird.
          </p>
          
          <p style="margin-top: 30px;">
            Herzliche Grüße,<br>
            das ila-Team<br>
            <a href="https://ila-web.de" style="color: #c21f2e; text-decoration: none;">ila-web.de</a>
          </p>
        </div>
      `,
    });

    console.log("✅ Correo de invitación PDF ABO enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar invitación PDF ABO:", error);
    throw new Error("No se pudo enviar la invitación PDF ABO.");
  }
}
