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
  "Artikel",
  "Nachricht",
  "Empfänger1Anrede",
  "Empfänger1Vorname",
  "Empfänger1Nachname",
  "Empfänger1Institution",
  "Empfänger1Strasse",
  "Empfänger1Adresszusatz",
  "Empfänger1PLZ",
  "Empfänger1Ort",
  "Empfänger1Land",
  "Empfänger1Telefon",
  "Empfänger1Artikel",
  "Empfänger2Anrede",
  "Empfänger2Vorname",
  "Empfänger2Nachname",
  "Empfänger2Institution",
  "Empfänger2Strasse",
  "Empfänger2Adresszusatz",
  "Empfänger2PLZ",
  "Empfänger2Ort",
  "Empfänger2Land",
  "Empfänger2Telefon",
  "Empfänger2Artikel",
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

function formatItems(items) {
  return items.map((it) => `ila ${it.edition.number} x${it.qty}`).join(" | ");
}

function recipientFields(rec, items, prefix) {
  if (!rec) {
    return {
      [`${prefix}Anrede`]: "",
      [`${prefix}Vorname`]: "",
      [`${prefix}Nachname`]: "",
      [`${prefix}Institution`]: "",
      [`${prefix}Strasse`]: "",
      [`${prefix}Adresszusatz`]: "",
      [`${prefix}PLZ`]: "",
      [`${prefix}Ort`]: "",
      [`${prefix}Land`]: "",
      [`${prefix}Telefon`]: "",
      [`${prefix}Artikel`]: "",
    };
  }
  return {
    [`${prefix}Anrede`]: rec.salutation,
    [`${prefix}Vorname`]: rec.firstName,
    [`${prefix}Nachname`]: rec.lastName,
    [`${prefix}Institution`]: rec.institution,
    [`${prefix}Strasse`]: rec.street,
    [`${prefix}Adresszusatz`]: rec.addressExtra,
    [`${prefix}PLZ`]: rec.zip,
    [`${prefix}Ort`]: rec.city,
    [`${prefix}Land`]: rec.country,
    [`${prefix}Telefon`]: rec.phone,
    [`${prefix}Artikel`]: formatItems(items),
  };
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { isNew: true },
      include: {
        items: { include: { edition: true } },
        recipients: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const rows = [CSV_HEADERS.join(CSV_SEPARATOR)];

    for (const order of orders) {
      const buyerItems = order.items.filter((i) => !i.recipientId);
      const rec1 = order.recipients[0];
      const rec2 = order.recipients[1];
      const rec1Items = rec1
        ? order.items.filter((i) => i.recipientId === rec1.id)
        : [];
      const rec2Items = rec2
        ? order.items.filter((i) => i.recipientId === rec2.id)
        : [];

      rows.push(
        buildRow({
          Bestelldatum: order.createdAt.toISOString().slice(0, 10),
          Anrede: order.salutation,
          Vorname: order.firstName,
          Nachname: order.lastName,
          Institution: order.institution,
          Strasse: order.street,
          Adresszusatz: order.addressExtra,
          PLZ: order.zip,
          Ort: order.city,
          Land: order.country,
          Telefon: order.phone,
          "E-Mail": order.email,
          Artikel: formatItems(buyerItems),
          Nachricht: order.message,
          ...recipientFields(rec1, rec1Items, "Empfänger1"),
          ...recipientFields(rec2, rec2Items, "Empfänger2"),
        })
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const csv = "﻿" + rows.join("\r\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ila-bestellungen-${today}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("❌ Error exporting orders CSV:", error);
    return NextResponse.json(
      { error: "Failed to export orders CSV" },
      { status: 500 }
    );
  }
}
