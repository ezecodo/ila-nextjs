import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { to, subject, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "ILA Bestellungen <bestellungen@ila-web.de>",
      to,
      subject: subject || "Antwort zu Ihrer ila-Bestellung",
      html: `
        <p>Liebe/r Kundin/Kunde,</p>
        <p>${message}</p>
        <br/>
        <p>Mit freundlichen Grüßen,<br/>Das ila-Team</p>
      `,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Error sending reply email:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
