import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id, name, description } = req.body;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        error: "Deneme ID gereklidir",
      });
    }

    const denemeRef = adminDb.collection("tarihdenemeler").doc(id);
    const doc = await denemeRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Deneme bulunamadı",
      });
    }

    await denemeRef.update({
      description: description || "",
      updatedAt: new Date(),
    });

    console.log(`Tarih denemesi güncellendi: ${id}`);

    res.status(200).json({
      success: true,
      message: "Deneme başarıyla güncellendi",
      data: {
        id,
        name: id,
        description: description || "",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Tarih denemesi güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "Deneme güncellenemedi",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
