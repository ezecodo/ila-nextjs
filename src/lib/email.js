import { Resend } from "resend";
import dotenv from "dotenv";
import * as Sentry from "@sentry/nextjs";

dotenv.config(); // ✅ Cargar las variables de entorno

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 🎨 Template base para emails de ila (header rojo con logo + card blanca + footer)
 */
function renderIlaEmail(bodyHtml, preheader = "") {
  // El logo siempre se sirve desde la URL pública de producción — los clientes de email
  // no pueden cargar http://localhost:3000 cuando se prueba desde dev.
  const logoUrl = "https://www.ila-web.de/logo/ila-Schriftzug_weiss.png";
  return `
    <!DOCTYPE html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>ila</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f2f2ef; font-family: Arial, Helvetica, sans-serif;">
        ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f2f2ef;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <tr>
                  <td align="center" style="background-color:#c21f2e; padding:36px 24px 28px 24px;">
                    <img src="${logoUrl}" alt="ila" width="120" style="display:block; border:0; max-width:120px; height:auto; margin:0 auto;">
                    <div style="margin-top:14px; font-family:Georgia, 'Times New Roman', serif; font-style:italic; font-size:15px; letter-spacing:0.02em; color:#ffffff; opacity:0.95;">
                      Das Lateinamerika-Magazin
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 40px 32px 40px; color:#1a1a1a; font-family: Arial, Helvetica, sans-serif; font-size:16px; line-height:1.6;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px; border-top:1px solid #eaeaea; background-color:#fafafa; text-align:center; font-family: Arial, Helvetica, sans-serif; font-size:13px; color:#777;">
                    <a href="https://ila-web.de" style="color:#c21f2e; text-decoration:none; font-weight:600;">ila-web.de</a><br>
                    <span style="color:#999;">Informationsstelle Lateinamerika e.V.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * 📩 Enviar email de verificación de cuenta
 */
export async function sendVerificationEmail(email, token) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

  const body = `
    <h1 style="margin:0 0 20px 0; font-size:26px; font-weight:700; color:#1a1a1a; letter-spacing:-0.01em;">Willkommen bei ila!</h1>

    <p style="margin:0 0 24px 0;">
      Nur noch ein Schritt zum neuen Digitalabo. Bitte verifiziere dein Konto mit diesem Link:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 32px 0;">
      <tr>
        <td style="background-color:#c21f2e; border-radius:4px;">
          <a href="${confirmUrl}" target="_blank"
             style="display:inline-block; padding:14px 32px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; font-family:Arial,Helvetica,sans-serif;">
            Konto verifizieren
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:32px 0 0 0; color:#555;">
      Solidarische Grüße<br>
      <strong style="color:#1a1a1a;">von der ila-Redaktion</strong>
    </p>
  `;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de", // 🚨 Asegúrate de que esta es una dirección válida del dominio verificado
      to: email,
      subject: "Willkommen bei ila – Konto verifizieren",
      html: renderIlaEmail(body, "Nur noch ein Schritt zum neuen Digitalabo"),
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
 * 🌐 Enviar invitación a una nueva traductora/traductor
 * Link a /auth/reset-password donde define su contraseña (y se verifica la cuenta).
 */
export async function sendTranslatorInvitationEmail(email, name = "", token) {
  const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  const saludo = name ? `Hola ${name},` : "¡Hola!";

  const body = `
    <h1 style="margin:0 0 20px 0; font-size:26px; font-weight:700; color:#1a1a1a; letter-spacing:-0.01em;">Bienvenida/o al equipo de traducción de ila</h1>

    <p style="margin:0 0 16px 0;">${saludo}</p>

    <p style="margin:0 0 24px 0;">
      Te hemos dado de alta como traductor/a en el sistema de ila. Para activar tu cuenta,
      definí tu contraseña haciendo clic en el siguiente botón:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 32px 0;">
      <tr>
        <td style="background-color:#c21f2e; border-radius:4px;">
          <a href="${setupUrl}" target="_blank"
             style="display:inline-block; padding:14px 32px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; font-family:Arial,Helvetica,sans-serif;">
            Definir mi contraseña
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px 0; color:#555;">Tu usuario es este correo: <strong style="color:#1a1a1a;">${email}</strong></p>
    <p style="margin:0 0 24px 0; color:#555;">Este enlace expira en 7 días.</p>

    <p style="margin:32px 0 0 0; color:#555;">
      Solidarische Grüße<br>
      <strong style="color:#1a1a1a;">von der ila-Redaktion</strong>
    </p>
  `;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: email,
      subject: "Invitación al equipo de traducción de ila",
      html: renderIlaEmail(body, "Activá tu cuenta de traductor/a en ila"),
    });

    console.log("✅ Invitación de traductor/a enviada:", response);
    return response;
  } catch (error) {
    Sentry.captureException(error);
    console.error("❌ Error al enviar invitación de traductor/a:", error);
    throw new Error("No se pudo enviar la invitación.");
  }
}

/**
 * 📰 Avisar a un traductor/a que se le asignó un artículo nuevo.
 * El botón lleva a su panel de asignaciones (requiere login).
 */
export async function sendTranslatorAssignmentEmail(
  email,
  name = "",
  { articleTitle = "", editionNumber = null } = {}
) {
  const panelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/de/dashboard/translators/assignments`;
  const saludo = name ? `Hola ${name},` : "¡Hola!";

  const dossierLine = editionNumber
    ? `<p style="margin:0 0 8px 0; color:#555;">Dossier: <strong style="color:#1a1a1a;">ila ${editionNumber}</strong></p>`
    : "";
  const tituloLine = articleTitle
    ? `<p style="margin:0 0 4px 0; color:#555;">Artículo: <strong style="color:#1a1a1a;">${articleTitle}</strong></p>`
    : "";

  const body = `
    <h1 style="margin:0 0 20px 0; font-size:26px; font-weight:700; color:#1a1a1a; letter-spacing:-0.01em;">Tenés un artículo nuevo para traducir</h1>

    <p style="margin:0 0 16px 0;">${saludo}</p>

    <p style="margin:0 0 24px 0;">
      Se te asignó un artículo en el sistema de ila. Podés verlo y empezar a
      trabajar desde tu panel de asignaciones:
    </p>

    ${
      tituloLine || dossierLine
        ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
            <tr>
              <td style="padding:16px 20px; background-color:#fafafa; border-left:4px solid #c21f2e; border-radius:4px;">
                ${tituloLine}
                ${dossierLine}
              </td>
            </tr>
          </table>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 32px 0;">
      <tr>
        <td style="background-color:#c21f2e; border-radius:4px;">
          <a href="${panelUrl}" target="_blank"
             style="display:inline-block; padding:14px 32px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; font-family:Arial,Helvetica,sans-serif;">
            Ir a mi panel
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px 0; color:#555;">
      Si todavía no iniciaste sesión, te pedirá hacerlo con tu correo
      (<strong style="color:#1a1a1a;">${email}</strong>) antes de mostrarte tus asignaciones.
    </p>

    <p style="margin:32px 0 0 0; color:#555;">
      Solidarische Grüße<br>
      <strong style="color:#1a1a1a;">von der ila-Redaktion</strong>
    </p>
  `;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: email,
      subject: "ila – Se te asignó un artículo para traducir",
      html: renderIlaEmail(body, "Tenés un artículo nuevo para traducir en ila"),
    });

    console.log("✅ Aviso de asignación de traducción enviado:", response);
    return response;
  } catch (error) {
    Sentry.captureException(error);
    console.error("❌ Error al enviar aviso de asignación:", error);
    throw new Error("No se pudo enviar el aviso de asignación.");
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

  // 🧾 Obtenemos el pedido completo con ediciones y destinatarios
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: { edition: true },
      },
      recipients: true,
    },
  });

  // 🗂️ Agrupar items por destinatario (null = comprador)
  const buyerItems = fullOrder.items.filter((i) => !i.recipientId);
  const itemsByRecipient = fullOrder.recipients.map((r) => ({
    recipient: r,
    items: fullOrder.items.filter((i) => i.recipientId === r.id),
  }));
  const hasExtraRecipients = fullOrder.recipients.length > 0;

  const renderItemsList = (items) =>
    items
      .map(
        (item) =>
          `<li>${item.qty} × <strong>ila ${item.edition.number}</strong> – ${item.edition.title}</li>`,
      )
      .join("");

  const renderAddress = (a) => `
    ${a.salutation ? `${a.salutation} ` : ""}${a.firstName} ${a.lastName}<br>
    ${a.institution ? `${a.institution}<br>` : ""}
    ${a.street}${a.addressExtra ? `, ${a.addressExtra}` : ""}<br>
    ${a.zip} ${a.city}<br>
    ${a.country}
    ${a.phone ? `<br>${isGerman ? "Tel." : "Tel."}: ${a.phone}` : ""}
  `;

  const shipmentBuyerTitle = isGerman
    ? "📦 Lieferung an Besteller"
    : "📦 Envío a quien hace el pedido";
  const shipmentRecipientTitle = (n) =>
    isGerman ? `📦 Lieferung an Empfänger ${n}` : `📦 Envío al destinatario ${n}`;

  // 🗂️ Bloque de envíos (lista plana si solo hay comprador, agrupado si hay extras)
  let shipmentsBlock = "";
  if (!hasExtraRecipients) {
    shipmentsBlock = `<ul style="padding-left:18px;">${renderItemsList(fullOrder.items)}</ul>`;
  } else {
    const buyerBlock = buyerItems.length
      ? `
        <div style="margin-top:18px;padding:12px 15px;border:1px solid #eee;border-radius:6px;background:#fafafa;">
          <h4 style="margin:0 0 8px 0;color:#c21f2e;">${shipmentBuyerTitle}</h4>
          <p style="margin:0 0 8px 0;font-size:13px;color:#555;">${renderAddress(fullOrder)}</p>
          <ul style="padding-left:18px;margin:0;">${renderItemsList(buyerItems)}</ul>
        </div>`
      : "";
    const recipientBlocks = itemsByRecipient
      .map(
        ({ recipient, items }, idx) => `
        <div style="margin-top:14px;padding:12px 15px;border:1px solid #eee;border-radius:6px;background:#fafafa;">
          <h4 style="margin:0 0 8px 0;color:#c21f2e;">${shipmentRecipientTitle(idx + 1)}</h4>
          <p style="margin:0 0 8px 0;font-size:13px;color:#555;">${renderAddress(recipient)}</p>
          <ul style="padding-left:18px;margin:0;">${renderItemsList(items)}</ul>
        </div>`,
      )
      .join("");
    shipmentsBlock = buyerBlock + recipientBlocks;
  }

  // 💬 Mensaje del usuario (opcional)
  const userMessage = fullOrder.message
    ? `<blockquote style="margin:15px 0;padding:10px 15px;border-left:4px solid #c21f2e;background:#f9f9f9;color:#333;">
        ${fullOrder.message}
      </blockquote>`
    : "";

  // 📨 HTML del correo
  const overviewTitle = isGerman ? "🧾 Bestellübersicht" : "🧾 Resumen de tu pedido";
  const singleAddressHeading = isGerman ? "📍 Lieferadresse" : "📍 Dirección de envío";

  const singleAddressBlock = !hasExtraRecipients
    ? `
        <h3 style="margin-top:25px;">${singleAddressHeading}</h3>
        <p>
          ${fullOrder.street}<br>
          ${fullOrder.zip} ${fullOrder.city}<br>
          ${fullOrder.country}
        </p>`
    : "";

  const html = isGerman
    ? `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:auto;">
        <h2 style="color:#c21f2e;">Danke für deine Bestellung!</h2>
        <p>Hallo <strong>${fullOrder.firstName} ${fullOrder.lastName}</strong>,</p>
        <p>wir haben deine Bestellung erhalten. In Kürze wird sich jemand aus unserem Team mit dir in Verbindung setzen.</p>

        <h3 style="margin-top:25px;">${overviewTitle}</h3>
        ${shipmentsBlock}

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

        ${singleAddressBlock}

        <p style="margin-top:30px;">Herzliche Grüße,<br>das ila-Team<br>
        <a href="https://ila-web.de" style="color:#c21f2e;text-decoration:none;">ila-web.de</a></p>
      </div>
    `
    : `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:auto;">
        <h2 style="color:#c21f2e;">¡Gracias por tu pedido de Dossiers!</h2>
        <p>Hola <strong>${fullOrder.firstName} ${fullOrder.lastName}</strong>,</p>
        <p>Hemos recibido correctamente tu pedido. En breve alguien de nuestro equipo se pondrá en contacto contigo.</p>

        <h3 style="margin-top:25px;">${overviewTitle}</h3>
        ${shipmentsBlock}

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

        ${singleAddressBlock}

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
export async function sendPdfAboInvitationEmail(email, name = "") {
  const params = new URLSearchParams({ pdfAbo: "true", email });
  if (name) params.set("name", name);
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?${params.toString()}`;
  const donateUrl = `${process.env.NEXT_PUBLIC_APP_URL}/de/support/donations`;
  const saludo = name ? `Hallo ${name},` : "Hallo,";

  const body = `
    <h1 style="margin:0 0 20px 0; font-size:26px; font-weight:700; color:#1a1a1a; letter-spacing:-0.01em;">Willkommen bei ila!</h1>

    <p style="margin:0 0 16px 0;">${saludo}</p>

    <p style="margin:0 0 24px 0;">
      dein <strong>Digitalabo</strong> der Zeitschrift <strong>ila</strong> ist jetzt verfügbar! Um Zugang zu den Ausgaben zu erhalten, registriere dich bitte mit dieser E-Mail-Adresse:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 32px 0;">
      <tr>
        <td style="background-color:#c21f2e; border-radius:4px;">
          <a href="${registerUrl}" target="_blank"
             style="display:inline-block; padding:14px 32px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; font-family:Arial,Helvetica,sans-serif;">
            Jetzt registrieren
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px 0;">
      Du erhältst dann eine E-Mail, um deine Registrierung zu bestätigen. Danach ist dein Konto bereit und du findest alle verfügbaren Ausgaben im Bereich <strong>„📰 Meine Dossiers (PDF)"</strong> deines persönlichen Dashboards. Zusätzlich kannst du Artikel als Favoriten markieren und dir daraus im Bereich <strong>„Lieblingsartikel"</strong> dein eigenes PDF-Paket zusammenstellen.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="padding:16px 20px; background-color:#fff5f5; border-left:4px solid #c21f2e; border-radius:4px; font-size:14px; color:#333; line-height:1.55;">
          <strong style="color:#c21f2e;">Wichtig:</strong> Bitte registriere dich mit genau dieser E-Mail-Adresse (<strong>${email}</strong>), damit dein Abo automatisch aktiviert wird.
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 16px 0;">
      Die Umstellung auf das neue Digitalsystem heißt: Die ila-Inhalte werden für alle zugänglich und ihr könnt sie leichter für eure Recherchen nutzen. Das ist teuer und unsere Kasse ist klamm. Hast du noch fünf Euro übrig? Dann freuen wir uns über eine <a href="${donateUrl}" style="color:#c21f2e; font-weight:600;">Spende</a>. Kennst du eine Freundin, die sich für unsere Inhalte interessiert? Dann freuen wir uns über eine Empfehlung.
    </p>

    <p style="margin:0 0 32px 0; font-weight:600; color:#1a1a1a;">
      Und jetzt: Spannendes Stöbern!
    </p>

    <p style="margin:0; color:#555;">
      Solidarische Grüße<br>
      <strong style="color:#1a1a1a;">von der ila-Redaktion</strong>
    </p>

    <p style="margin:28px 0 0 0; padding-top:18px; border-top:1px solid #eaeaea; font-size:13px; line-height:1.5; color:#999;">
      Bitte antworte nicht auf diese E-Mail. Bei Fragen schreib uns gerne an
      <a href="mailto:ila-bonn@t-online.de" style="color:#c21f2e; text-decoration:none; font-weight:600;">ila-bonn@t-online.de</a>.
    </p>
  `;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: email,
      subject: "Dein Digitalabo bei ila ist bereit!",
      html: renderIlaEmail(body, "Dein Digitalabo der Zeitschrift ila ist jetzt verfügbar"),
    });

    console.log("✅ Correo de invitación PDF ABO enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar invitación PDF ABO:", error);
    throw new Error("No se pudo enviar la invitación PDF ABO.");
  }
}

/**
 * 📩 Recordatorio para quienes todavía no activaron su Digitalabo (PDF-Abo)
 */
export async function sendPdfAboReminderEmail(email, name = "") {
  const params = new URLSearchParams({ pdfAbo: "true", email });
  if (name) params.set("name", name);
  const registerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?${params.toString()}`;
  const saludo = name ? `Hallo ${name},` : "Hallo,";

  const body = `
    <h1 style="margin:0 0 20px 0; font-size:26px; font-weight:700; color:#1a1a1a; letter-spacing:-0.01em;">Noch nicht aktiviert!</h1>

    <p style="margin:0 0 16px 0;">${saludo}</p>

    <p style="margin:0 0 24px 0;">
      wir haben gesehen, dass du dein <strong>Digitalabo</strong> der Zeitschrift <strong>ila</strong> noch nicht aktiviert hast. Es wartet weiterhin auf dich — verpasse nicht den Zugang zum vollständigen Archiv und vielem mehr.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 32px 0;">
      <tr>
        <td style="background-color:#c21f2e; border-radius:4px;">
          <a href="${registerUrl}" target="_blank"
             style="display:inline-block; padding:14px 32px; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; font-family:Arial,Helvetica,sans-serif;">
            Jetzt aktivieren
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 20px 0;">
      Die Registrierung dauert nur eine Minute. Danach findest du alle verfügbaren Ausgaben im Bereich <strong>„📰 Meine Dossiers (PDF)"</strong> deines persönlichen Dashboards. Zusätzlich kannst du Artikel als Favoriten markieren und dir daraus im Bereich <strong>„Lieblingsartikel"</strong> dein eigenes PDF-Paket zusammenstellen.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="padding:16px 20px; background-color:#fff5f5; border-left:4px solid #c21f2e; border-radius:4px; font-size:14px; color:#333; line-height:1.55;">
          <strong style="color:#c21f2e;">Wichtig:</strong> Bitte registriere dich mit genau dieser E-Mail-Adresse (<strong>${email}</strong>), damit dein Abo automatisch aktiviert wird.
        </td>
      </tr>
    </table>

    <p style="margin:0; color:#555;">
      Solidarische Grüße<br>
      <strong style="color:#1a1a1a;">von der ila-Redaktion</strong>
    </p>

    <p style="margin:28px 0 0 0; padding-top:18px; border-top:1px solid #eaeaea; font-size:13px; line-height:1.5; color:#999;">
      Bitte antworte nicht auf diese E-Mail. Bei Fragen schreib uns gerne an
      <a href="mailto:ila-bonn@t-online.de" style="color:#c21f2e; text-decoration:none; font-weight:600;">ila-bonn@t-online.de</a>.
    </p>
  `;

  try {
    const response = await resend.emails.send({
      from: "no-reply@ila-web.de",
      to: email,
      subject: "Erinnerung: Dein Digitalabo bei ila wartet auf dich",
      html: renderIlaEmail(body, "Aktiviere jetzt dein Digitalabo der Zeitschrift ila"),
    });

    console.log("✅ Correo de recordatorio PDF ABO enviado:", response);
    return response;
  } catch (error) {
    console.error("❌ Error al enviar recordatorio PDF ABO:", error);
    throw new Error("No se pudo enviar el recordatorio PDF ABO.");
  }
}
