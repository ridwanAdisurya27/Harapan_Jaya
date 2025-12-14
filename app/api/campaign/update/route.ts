import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract fields
    const judul = formData.get("judul") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const campaignId = formData.get("campaignId") as string;
    const userEmail = formData.get("userEmail") as string;
    const userName = formData.get("userName") as string;
    const imageFile = formData.get("image") as File | null;

    // Validation
    if (!judul || !deskripsi || !campaignId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    let imageUrl = "";

    // Upload image if exists
    if (imageFile) {
      console.log("Uploading update image...");
      const uploadFormData = new FormData();
      uploadFormData.append("file", imageFile);
      uploadFormData.append("campaignId", campaignId);

      const uploadResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin
        }/api/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );

      if (!uploadResponse.ok) {
        console.error("Failed to upload image");
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || "Failed to upload image");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload result:", uploadResult);
      imageUrl = uploadResult.result?.cdnUrl || uploadResult.url || "";
    }

    // Create update document
    const updateData = {
      campaign_id: campaignId,
      judul: judul,
      deskripsi: deskripsi, // HTML content
      tanggal: new Date().toISOString(),
      author: userName || userEmail || "Admin",
      created_at: serverTimestamp(),
      image_url: imageUrl,
    };

    const docRef = await addDoc(collection(db, "updatesv2"), updateData);

    return NextResponse.json({
      success: true,
      message: "Update created successfully",
      data: {
        id: docRef.id,
        ...updateData,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating update:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
