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

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Deneme adı gereklidir",
      });
    }

    const denemeName = name.trim();

    // Deneme adının benzersiz olup olmadığını kontrol et
    const existingDoc = await adminDb
      .collection("denemeler")
      .doc(denemeName)
      .get();

    if (existingDoc.exists) {
      return res.status(409).json({
        success: false,
        error: "Bu isimde bir genel denemesi zaten mevcut",
      });
    }

    // Yeni deneme dokümanını oluştur
    const denemeRef = adminDb.collection("denemeler").doc(denemeName);

    await denemeRef.set({
      name: denemeName,
      description: description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      soruSayisi: 0, // Başlangıçta 0 soru
    });

    console.log(`Yeni genel denemesi oluşturuldu: ${denemeName}`);

    res.status(201).json({
      success: true,
      message: "Genel denemesi başarıyla oluşturuldu",
      data: {
        id: denemeName,
        name: denemeName,
        description: description || "",
        createdAt: new Date().toISOString(),
        status: "active",
        soruSayisi: 0,
      },
    });
  } catch (error) {
    console.error("Genel denemesi oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      error: "Genel denemesi oluşturulamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
