import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { uploadFile, deleteFile } from "@/lib/localUpload";

// ✅ GET — público, ordenado para la página /about/editorial
export async function GET() {
  try {
    const members = await prisma.redaktionMember.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error("❌ Error fetching redaktion team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ POST — crear o actualizar (solo admin)
export async function POST(req) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const id = formData.get("id");
    const currentPhotoUrl = formData.get("currentPhotoUrl");

    const name = formData.get("name");
    const bio = formData.get("bio") || null;
    const bioES = formData.get("bioES") || null;
    const orderRaw = formData.get("order");
    const file = formData.get("photo");

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let photoUrl = currentPhotoUrl || null;
    if (file && file.size > 0) {
      const { url } = await uploadFile(file, "images/redaktion-team");
      photoUrl = url;
    }

    const memberData = {
      name,
      bio,
      bioES,
      photoUrl,
      order:
        orderRaw !== null && orderRaw !== "" ? parseInt(orderRaw, 10) : 0,
    };

    let result;
    if (id) {
      result = await prisma.redaktionMember.update({
        where: { id: parseInt(id, 10) },
        data: memberData,
      });
      return NextResponse.json(
        { success: true, member: result },
        { status: 200 }
      );
    } else {
      result = await prisma.redaktionMember.create({ data: memberData });
      return NextResponse.json(
        { success: true, member: result },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("❌ Error saving redaktion member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 🔴 DELETE — borrado definitivo (quitar a alguien de la Redaktion)
export async function DELETE(req) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const member = await prisma.redaktionMember.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.photoUrl) {
      await deleteFile(member.photoUrl);
    }

    await prisma.redaktionMember.delete({ where: { id: parseInt(id, 10) } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deleting redaktion member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
