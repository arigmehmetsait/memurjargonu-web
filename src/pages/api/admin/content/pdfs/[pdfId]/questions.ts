import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth } from "@/lib/firebaseAdmin";
import { adminDb } from "@/lib/firebaseAdmin";
import { PDFSubcategory } from "@/types/pdf";
import { getFirebaseCollectionName } from "@/constants/pdfCategories";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { pdfId, subcategory } = req.query;

  if (!pdfId || typeof pdfId !== "string") {
    return res.status(400).json({ error: "pdfId gerekli" });
  }

  if (!subcategory || typeof subcategory !== "string") {
    return res.status(400).json({ error: "subcategory gerekli" });
  }

  try {
    // Authorization header kontrolü
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Yetki token'i bulunamadı" });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Token doğrulama
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: "Geçersiz token" });
    }

    // Admin yetkisi kontrolü
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    if (!customClaims.admin) {
      return res.status(403).json({ error: "Admin yetkisi gerekli" });
    }

    const collectionName = getFirebaseCollectionName(
      subcategory as PDFSubcategory
    );
    const docRef = adminDb.collection(collectionName).doc(pdfId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "PDF dosyası bulunamadı" });
    }

    const data = doc.data();
    const questions = data?.questions || {};

    switch (req.method) {
      case "GET":
        return res.status(200).json({
          success: true,
          data: questions,
        });

      case "POST":
        // Yeni soru ekle
        const { questionKey, answer, options } = req.body;

        if (!questionKey || !questionKey.trim()) {
          return res.status(400).json({ error: "Soru anahtarı zorunludur" });
        }

        if (!Array.isArray(options) || options.length < 2) {
          return res.status(400).json({
            error: "En az iki seçenek gereklidir",
          });
        }

        const newQuestion = {
          answer: answer?.trim() || "",
          options: options.map((opt: any) => String(opt).trim()),
        };

        await docRef.update({
          [`questions.${questionKey.trim()}`]: newQuestion,
          updatedAt: new Date(),
        });

        return res.status(201).json({
          success: true,
          data: {
            [questionKey.trim()]: newQuestion,
          },
        });

      case "PUT":
        // Soru güncelle
        const { updateQuestionKey, updateAnswer, updateOptions } = req.body;

        if (!updateQuestionKey || !updateQuestionKey.trim()) {
          return res.status(400).json({ error: "Soru anahtarı zorunludur" });
        }

        if (!questions[updateQuestionKey.trim()]) {
          return res.status(404).json({ error: "Soru bulunamadı" });
        }

        const updatedQuestion: Record<string, any> = {};

        if (updateAnswer !== undefined) {
          updatedQuestion.answer = updateAnswer.trim();
        }

        if (updateOptions !== undefined) {
          if (!Array.isArray(updateOptions) || updateOptions.length < 2) {
            return res.status(400).json({
              error: "En az iki seçenek gereklidir",
            });
          }
          updatedQuestion.options = updateOptions.map((opt: any) =>
            String(opt).trim()
          );
        }

        await docRef.update({
          [`questions.${updateQuestionKey.trim()}`]: {
            ...questions[updateQuestionKey.trim()],
            ...updatedQuestion,
          },
          updatedAt: new Date(),
        });

        return res.status(200).json({
          success: true,
          message: "Soru güncellendi",
        });

      case "DELETE":
        // Soru sil
        const { deleteQuestionKey } = req.body;

        if (!deleteQuestionKey || !deleteQuestionKey.trim()) {
          return res.status(400).json({ error: "Soru anahtarı zorunludur" });
        }

        const updatedQuestions = { ...questions };
        delete updatedQuestions[deleteQuestionKey.trim()];

        await docRef.update({
          questions: updatedQuestions,
          updatedAt: new Date(),
        });

        return res.status(200).json({
          success: true,
          message: "Soru silindi",
        });

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("PDF Questions API error:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem gerçekleştirilirken hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

