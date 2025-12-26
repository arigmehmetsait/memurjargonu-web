import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Token doğrulama
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Admin yetkisi kontrolü
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({ error: "Admin yetkisi gerekli" });
    }

    const { docId } = req.query;

    if (!docId || typeof docId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Doküman ID gerekli",
      });
    }

    const docRef = adminDb.collection("eşleştirmeler").doc(docId);

    // GET - Dokümanı getir
    if (req.method === "GET") {
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doküman bulunamadı",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          ...doc.data(),
        },
      });
    }

    // PUT - Dokümanı güncelle
    if (req.method === "PUT") {
      const { fieldPath, value } = req.body;

      if (!fieldPath || typeof fieldPath !== "string") {
        return res.status(400).json({
          success: false,
          error: "fieldPath gereklidir",
        });
      }

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          error: "value gereklidir",
        });
      }

      // Nested path kontrolü (örn: "level7.Gider üzerinden alınan vergiler")
      const isNestedPath = fieldPath.includes(".");
      const topLevelPath = isNestedPath ? fieldPath.split(".")[0] : fieldPath;
      const nestedPath = isNestedPath ? fieldPath.split(".").slice(1).join(".") : null;

      const doc = await docRef.get();
      const docData = (doc.exists ? doc.data() : {}) as Record<string, any>;

      let finalValue: any;

      // Nested path için mevcut parent object'i al ve merge et
      if (isNestedPath && nestedPath) {
        const existingParent = docData[topLevelPath] || {};
        
        // Deep clone yaparak mevcut parent object'i koru
        const updatedParent = JSON.parse(JSON.stringify(existingParent));
        
        // Nested path'i parçalara ayır (örn: "Gider üzerinden alınan vergiler" veya "level8.soru1")
        const pathParts = nestedPath.split(".");
        
        // Nested path'e göre değeri yerleştir
        let current: any = updatedParent;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const key = pathParts[i];
          if (!current[key] || typeof current[key] !== "object") {
            current[key] = {};
          }
          current = current[key];
        }
        
        // Son key'e değeri ata
        const lastKey = pathParts[pathParts.length - 1];
        current[lastKey] = value;
        
        finalValue = updatedParent;
      } else {
        // Top-level path için
        finalValue = value;
      }

      // Eğer top-level level oluşturuluyor veya güncelleniyorsa, otomatik order ekle
      // Nested path'ler için order ekleme YAPMA - sadece mevcut order'ı koru
      if (topLevelPath.startsWith("level") && typeof finalValue === "object" && finalValue !== null) {
        if (isNestedPath) {
          // Nested path için: Mevcut order'ı koru (eğer varsa)
          const existingLevel = docData[topLevelPath];
          if (existingLevel && typeof existingLevel === "object" && typeof existingLevel.order === "number") {
            finalValue.order = existingLevel.order;
          }
        } else {
          // Top-level path için: Order mantığını uygula
          // Eğer gelen veride order varsa, onu kullan (sıralama güncellemesi için)
          if (typeof finalValue.order === "number") {
            // Order zaten var, değiştirme
          } else {
            // Order yoksa, mevcut order'ı koru veya yeni order ata
            const existingLevel = docData[topLevelPath];
            if (existingLevel && typeof existingLevel === "object" && typeof existingLevel.order === "number") {
              // Mevcut order'ı koru
              finalValue = {
                ...finalValue,
                order: existingLevel.order,
              };
            } else {
              // Yeni level için order = maxOrder + 1
              let maxOrder = 0;
              Object.keys(docData).forEach((key) => {
                if (key.startsWith("level") && docData[key] && typeof docData[key] === "object") {
                  const levelOrder = docData[key].order;
                  if (typeof levelOrder === "number" && levelOrder > maxOrder) {
                    maxOrder = levelOrder;
                  }
                }
              });
              
              finalValue = {
                ...finalValue,
                order: maxOrder + 1,
              };
            }
          }
        }
      }

      // Güncelleme yap
      const updateData: Record<string, unknown> = {
        [topLevelPath]: finalValue,
        updatedAt: new Date(),
      };
      await docRef.update(updateData);

      console.log(`Eşleştirme dokümanı güncellendi: ${docId}`);

      return res.status(200).json({
        success: true,
        message: "Doküman başarıyla güncellendi",
      });
    }

    // DELETE - Alan veya doküman sil
    if (req.method === "DELETE") {
      const { fieldPath } = req.body;

      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doküman bulunamadı",
        });
      }

      // Eğer fieldPath varsa sadece o alanı sil
      if (fieldPath && typeof fieldPath === "string") {
        const deleteData: Record<string, any> = {
          [fieldPath]: FieldValue.delete(),
          updatedAt: new Date(),
        };

        await docRef.update(deleteData);

        console.log(`Eşleştirme dokümanından alan silindi: ${docId} - ${fieldPath}`);

        return res.status(200).json({
          success: true,
          message: "Alan başarıyla silindi",
        });
      }

      // fieldPath yoksa tüm dokümanı sil
      await docRef.delete();

      console.log(`Eşleştirme dokümanı silindi: ${docId}`);

      return res.status(200).json({
        success: true,
        message: "Doküman başarıyla silindi",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Eşleştirme dokümanı işlemi hatası:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem sırasında hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

