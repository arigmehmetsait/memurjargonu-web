import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { denemeId, collection } = req.query;

  if (!denemeId || typeof denemeId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Deneme ID gerekli",
    });
  }

  // Koleksiyon adı yoksa varsayılan olarak "sorular" kullan
  const collectionName = typeof collection === "string" ? collection : "sorular";

  try {
    // Deneme dokümanını kontrol et
    const denemeDoc = await adminDb
      .collection("dogruyanlis")
      .doc(denemeId)
      .get();

    if (!denemeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Doğru-Yanlış denemesi bulunamadı",
      });
    }

    const denemeData = denemeDoc.data();

    // Seçilen alt koleksiyonu getir
    const sorularSnapshot = await denemeDoc.ref.collection(collectionName).get();

    // Metadata dokümanını filtrele
    const sorular = sorularSnapshot.docs
      .filter((doc) => doc.id !== "_metadata")
      .map((doc) => {
      const data = doc.data();

      // Resimdeki modele göre sadece text ve correct alanları
      const soruText = data.text || "Soru metni bulunamadı";
      const correctAnswer = data.correct || "Cevap bulunamadı";
      const description = data.description || "";

      // Firebase'den gelen veriyi frontend formatına çevir
      const soru = {
        id: doc.id,
        soru: soruText,
        cevap: correctAnswer,
        secenekler: ["Doğru", "Yanlış"],
        dogruSecenek: 0, // Varsayılan değer
        aciklama: description,
        zorluk: "orta",
        konu: "Doğru-Yanlış",
        createdAt: null,
        updatedAt: null,
        status: "active",
      };

      // Doğru cevabı bul ve index'ini hesapla
      if (soru.cevap && soru.secenekler.length > 0) {
        const cevapIndex = soru.secenekler.findIndex((secenek: string) => {
          return secenek === soru.cevap;
        });

        if (cevapIndex !== -1) {
          soru.dogruSecenek = cevapIndex;
        }
      }

      return soru;
    });

    // Soruları ID'ye göre sırala (soru1, soru2, soru3...)
    sorular.sort((a, b) => {
      const aNum = parseInt(a.id.replace("soru", ""));
      const bNum = parseInt(b.id.replace("soru", ""));
      return aNum - bNum;
    });

    console.log(
      `Doğru-Yanlış denemesi ${collectionName} soruları hazırlandı: ${sorular.length} soru`
    );

    res.status(200).json({
      success: true,
      data: {
        denemeId,
        denemeName: denemeData?.name || denemeId,
        collectionName,
        sorular,
        totalCount: sorular.length,
      },
    });
  } catch (error) {
    console.error("Doğru-Yanlış denemesi soruları alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Doğru-Yanlış denemesi soruları alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
