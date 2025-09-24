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
        error: "Deneme ID gereklidir",
      });
    }

    // Deneme dokümanının var olup olmadığını kontrol et
    const denemeRef = adminDb.collection("MevzuatDeneme").doc(denemeId);
    const denemeDoc = await denemeRef.get();

    if (!denemeDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Deneme bulunamadı",
      });
    }

    // Sorular alt koleksiyonunu getir
    const sorularSnapshot = await denemeRef.collection("sorular").get();

    const sorular = sorularSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Gerçek veri alanlarını kullan
      const soru = data.questionText || data.soru || "";
      const cevap = data.correctAnswer || data.cevap || "";
      const secenekler = data.options || data.secenekler || [];

      // Doğru seçeneğin index'ini hesapla
      let dogruSecenek = data.dogruSecenek || 0;

      // Eğer cevap formatı "A) ...", "B) ..." şeklindeyse, doğru index'i bul
      if (cevap && secenekler.length > 0) {
        const cevapHarf = cevap.charAt(0); // "B) İlköğretim" -> "B"
        const dogruIndex = secenekler.findIndex(
          (secenek: string) => secenek.charAt(0) === cevapHarf
        );
        if (dogruIndex !== -1) {
          dogruSecenek = dogruIndex;
        }
      }

      return {
        id: doc.id,
        soru,
        cevap,
        secenekler,
        dogruSecenek,
        aciklama: "",
        zorluk: "orta",
        konu: "Mevzuat",
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        status: "active",
      };
    });

    // Soruları ID'ye göre sırala (soru1, soru2, soru3...)
    sorular.sort((a, b) => {
      const aNum = parseInt(a.id.replace("soru", ""));
      const bNum = parseInt(b.id.replace("soru", ""));
      return aNum - bNum;
    });

    res.status(200).json({
      success: true,
      data: {
        denemeId,
        denemeName: denemeDoc.data()?.name || denemeId,
        sorular,
        totalCount: sorular.length,
      },
    });
  } catch (error) {
    console.error("Sorular listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Sorular listesi alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
