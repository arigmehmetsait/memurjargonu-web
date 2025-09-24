import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Deneme adı gereklidir",
      });
    }

    console.log("Yeni Doğru-Yanlış denemesi oluşturuluyor:", name);

    // Deneme adından ID oluştur (Türkçe karakterleri temizle ve küçük harfe çevir)
    const cleanName = name
      .trim()
      .toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");

    const denemeId = `dogru-yanlis-${cleanName}-${Date.now()}`;

    // Deneme dokümanını oluştur
    const denemeData = {
      name: name.trim(),
      description: description?.trim() || "",
      soruSayisi: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    };

    await adminDb.collection("dogruyanlis").doc(denemeId).set(denemeData);

    console.log(`Doğru-Yanlış denemesi oluşturuldu: ${denemeId}`);

    res.status(201).json({
      success: true,
      data: {
        id: denemeId,
        name: denemeData.name,
        description: denemeData.description,
        soruSayisi: 0,
      },
      message: "Doğru-Yanlış denemesi başarıyla oluşturuldu",
    });
  } catch (error) {
    console.error("Doğru-Yanlış denemesi oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      error: "Doğru-Yanlış denemesi oluşturulamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
