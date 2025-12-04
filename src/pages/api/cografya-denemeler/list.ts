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
    console.log(
      "RealCografyaDenemeler Firebase Admin DB bağlantısı test ediliyor..."
    );

    // Pagination parametrelerini al
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    // RealCografyaDenemeler koleksiyonundaki tüm denemeleri getir
    const denemelerSnapshot = await adminDb
      .collection("RealCografyaDenemeler")
      .get();

    const allDenemeler = denemelerSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.id,
      soruSayisi: 0,
    }));

    // Her deneme için soru sayısını hesapla
    for (let i = 0; i < allDenemeler.length; i++) {
      try {
        const sorularSnapshot = await adminDb
          .collection("RealCografyaDenemeler")
          .doc(allDenemeler[i].id)
          .collection("soru1")
          .get();

        allDenemeler[i].soruSayisi = sorularSnapshot.size;
      } catch (soruError) {
        console.error(
          `${allDenemeler[i].id} için soru sayısı alınırken hata:`,
          soruError
        );
        allDenemeler[i].soruSayisi = 0;
      }
    }

    // Pagination uygula
    const total = allDenemeler.length;
    const denemeler = allDenemeler.slice(skip, skip + pageSize);

    res.status(200).json({
      success: true,
      data: denemeler,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Coğrafya denemeleri listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Coğrafya denemeleri listesi alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
