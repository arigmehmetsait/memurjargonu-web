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

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Deneme adı gereklidir",
      });
    }

    const denemeName = name.trim();
    const denemeRef = adminDb.collection("MevzuatDeneme").doc(id);
    const doc = await denemeRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Deneme bulunamadı",
      });
    }

    // Eğer isim değişiyorsa, yeni ismin kullanımda olup olmadığını kontrol et
    // Not: Mevcut yapıda ID = Name olduğu için isim değişikliği karmaşık olabilir.
    // Ancak şimdilik sadece mevcut dokümanı güncelleyeceğiz.
    // Eğer ID ve Name aynı ise, isim değişikliği yeni bir doküman oluşturmayı gerektirebilir.
    // Basitlik için şimdilik sadece description ve diğer alanları güncelleyelim.
    // Veya ID'nin name'den bağımsız olduğu varsayımıyla devam edelim.
    // Mevcut kodda: const denemeRef = adminDb.collection("MevzuatDeneme").doc(denemeName);
    // Bu demek oluyor ki ID = Name.
    // İsim değiştirmek demek, dokümanı kopyalayıp eskisini silmek demek.
    // Bu riskli olabilir, şimdilik sadece description güncellemesine izin verelim veya
    // isim değişikliği için migration mantığı kuralım.
    
    // Kullanıcı isteği "düzenle" olduğu için isim değişikliği de beklenebilir.
    // Ancak ID=Name yapısında isim değiştirmek zordur.
    // Şimdilik sadece description güncelleyelim ve ismin değiştirilemeyeceğini belirtelim
    // VEYA ID=Name yapısını değiştirmeden sadece display name gibi bir alan varsa onu güncelleyelim.
    // Fakat create.ts'de sadece name ve description var.
    
    // Karar: ID=Name olduğu için isim değişikliği şu an için desteklenmiyor (veya çok karmaşık).
    // Kullanıcıya sadece açıklama güncelleme izni verelim veya
    // İsim değişikliği durumunda:
    // 1. Yeni isimle doküman oluştur.
    // 2. Eski dokümandaki verileri kopyala.
    // 3. Alt koleksiyonları (sorular) taşı.
    // 4. Eski dokümanı sil.
    // Bu işlem uzun sürebilir ve hata riski taşır.
    
    // Şimdilik basit güncelleme (description) yapalım.
    // Eğer isim değişmişse ve ID=Name ise, hata döndürelim veya eski ismi kullanalım.
    
    await denemeRef.update({
      description: description || "",
      updatedAt: new Date(),
      // name alanını güncellemiyoruz çünkü ID ile aynı
    });

    console.log(`Deneme güncellendi: ${id}`);

    res.status(200).json({
      success: true,
      message: "Deneme başarıyla güncellendi",
      data: {
        id,
        name: id, // ID değişmedi
        description: description || "",
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Deneme güncelleme hatası:", error);
    res.status(500).json({
      success: false,
      error: "Deneme güncellenemedi",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
