import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CSV_SEPARATOR = ";";
const CSV_HEADERS = [
  "Bestelldatum",
  "Anrede",
  "Vorname",
  "Nachname",
  "Institution",
  "Strasse",
  "Adresszusatz",
  "PLZ",
  "Ort",
  "Land",
  "Telefon",
  "E-Mail",
  "Abotyp",
  "Format",
  "Startjahr",
  "Geschenkabo",
  "VersandPrämie",
  "Geschenkdauer",
  "Prämie",
  "Spende",
  "Nachricht",
  "GeschenkempfängerName",
  "GeschenkempfängerEmail",
  "GeschenkempfängerStrasse",
  "GeschenkempfängerPLZ",
  "GeschenkempfängerOrt",
  "GeschenkempfängerLand",
];

function escapeCsvField(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(CSV_SEPARATOR) ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildRow(fields) {
  return CSV_HEADERS.map((h) => escapeCsvField(fields[h])).join(CSV_SEPARATOR);
}

export async function GET() {
  try {
    const subs = await prisma.subscription.findMany({
      where: { isNew: true },
      include: { gift: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });

    const rows = [CSV_HEADERS.join(CSV_SEPARATOR)];

    for (const sub of subs) {
      rows.push(
        buildRow({
          Bestelldatum: sub.createdAt.toISOString().slice(0, 10),
          Anrede: sub.salutation,
          Vorname: sub.firstName,
          Nachname: sub.lastName,
          Institution: sub.institution,
          Strasse: sub.street,
          Adresszusatz: sub.addressExtra,
          PLZ: sub.zip,
          Ort: sub.city,
          Land: sub.country,
          Telefon: sub.phone,
          "E-Mail": sub.email,
          Abotyp: sub.type,
          Format: sub.format,
          Startjahr: sub.startYear,
          Geschenkabo: sub.isGift ? "Ja" : "Nein",
          "VersandPrämie": sub.giftDelivery,
          Geschenkdauer: sub.giftSubscriptionDuration,
          "Prämie": sub.gift?.name,
          Spende: sub.donationExtra,
          Nachricht: sub.message,
          "GeschenkempfängerName": sub.giftRecipientName,
          "GeschenkempfängerEmail": sub.giftRecipientEmail,
          "GeschenkempfängerStrasse": sub.giftRecipientStreet,
          "GeschenkempfängerPLZ": sub.giftRecipientZip,
          "GeschenkempfängerOrt": sub.giftRecipientCity,
          "GeschenkempfängerLand": sub.giftRecipientCountry,
        })
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const csv = "﻿" + rows.join("\r\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ila-abos-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ Error exporting subscriptions CSV:", error);
    return NextResponse.json(
      { error: "Failed to export subscriptions CSV" },
      { status: 500 }
    );
  }
}
