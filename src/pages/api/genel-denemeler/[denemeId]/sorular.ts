import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { denemeId } = req.query;

    if (!denemeId || typeof denemeId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Deneme ID gerekli",
      });
    }

    // Deneme dokümanını kontrol et
    const denemeDoc = await adminDb.collection("denemeler").doc(denemeId).get();

    if (!denemeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Genel denemesi bulunamadı",
      });
    }

    const denemeData = denemeDoc.data();

    // Sorular alt koleksiyonunu getir (genel yapısı: soru1 koleksiyonu)
    const sorularSnapshot = await denemeDoc.ref.collection("soru1").get();

    const sorular = sorularSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Firebase'den gelen veriyi frontend formatına çevir
      const soru = {
        id: doc.id,
        soru: data.questionText || "Soru metni bulunamadı",
        cevap: data.correctAnswer || "Cevap bulunamadı",
        secenekler: data.options || ["A", "B", "C", "D"],
        dogruSecenek: 0, // Varsayılan değer
        aciklama: "",
        zorluk: "orta",
        konu: "Genel",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        status: "active",
      };

      // Doğru cevabı bul ve index'ini hesapla
      if (soru.cevap && soru.secenekler.length > 0) {
        // Cevap formatı: "B) İlköğretim" gibi olabilir
        const cevapText = soru.cevap;
        const cevapIndex = soru.secenekler.findIndex((secenek: string) => {
          // Hem tam eşleşme hem de içerik eşleşmesi kontrol et
          return (
            secenek === cevapText ||
            secenek.includes(cevapText) ||
            cevapText.includes(secenek)
          );
        });

        if (cevapIndex !== -1) {
          soru.dogruSecenek = cevapIndex;
        } else {
          // Eğer eşleşme bulunamazsa, cevabın ilk karakterini kontrol et (A, B, C, D)
          const firstChar = cevapText.charAt(0).toUpperCase();
          const charIndex = firstChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
          if (charIndex >= 0 && charIndex < soru.secenekler.length) {
            soru.dogruSecenek = charIndex;
          }
        }
      }

      return soru;
    });

    res.status(200).json({
      success: true,
      data: {
        denemeId,
        denemeName: denemeData?.name || denemeId,
        sorular,
        totalCount: sorular.length,
      },
    });
  } catch (error) {
    console.error("Genel denemesi soruları alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Genel denemesi soruları alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
