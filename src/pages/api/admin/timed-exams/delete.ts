import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import { TimedExamApiResponse } from "@/types/timedExam";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TimedExamApiResponse<null>>
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { examId } = req.query;

    if (!examId || typeof examId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Sınav ID gerekli",
      });
    }

    // Sınavın var olup olmadığını kontrol et
    const examDoc = await adminDb.collection("timed_exams").doc(examId).get();

    if (!examDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Sınav bulunamadı",
      });
    }

    // Batch işlemi ile sınav ve alt koleksiyonlarını sil
    const batch = adminDb.batch();

    // Rankings alt koleksiyonunu sil
    const rankingsSnapshot = await adminDb
      .collection("timed_exams")
      .doc(examId)
      .collection("rankings")
      .get();

    rankingsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Ana sınav dokümanını sil
    batch.delete(adminDb.collection("timed_exams").doc(examId));

    await batch.commit();

    console.log(`Zamanlı sınav silindi: ${examId}`);

    res.status(200).json({
      success: true,
      message: "Zamanlı sınav başarıyla silindi",
    });
  } catch (error) {
    console.error("Zamanlı sınav silinirken hata:", error);
    res.status(500).json({
      success: false,
      error: "Zamanlı sınav silinemedi",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
