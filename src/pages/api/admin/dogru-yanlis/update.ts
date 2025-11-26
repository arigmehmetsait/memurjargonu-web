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
    const { denemeId, name, description } = req.body;

    if (!denemeId || typeof denemeId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Deneme ID gereklidir",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Deneme adı gereklidir",
      });
    }

    console.log("Doğru-Yanlış denemesi güncelleniyor:", denemeId);

    const denemeDocRef = adminDb.collection("dogruyanlis").doc(denemeId);
    const denemeDoc = await denemeDocRef.get();

    if (!denemeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Doğru-Yanlış denemesi bulunamadı",
      });
    }

    const updatedData = {
      name: name.trim(),
      description: description?.trim() || "",
      updatedAt: new Date(),
    };

    await denemeDocRef.update(updatedData);

    console.log("Doğru-Yanlış denemesi güncellendi:", denemeId);

    res.status(200).json({
      success: true,
      data: {
        id: denemeId,
        ...updatedData,
      },
      message: "Doğru-Yanlış denemesi başarıyla güncellendi",
    });
  } catch (error) {
    console.error("Doğru-Yanlış denemesi güncellenirken hata:", error);
    res.status(500).json({
      success: false,
      error: "Doğru-Yanlış denemesi güncellenemedi",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
