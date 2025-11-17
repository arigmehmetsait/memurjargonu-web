import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import { TimedExamListItem, TimedExamApiResponse } from "@/types/timedExam";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TimedExamApiResponse<TimedExamListItem[]>>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // timed_exams koleksiyonundan tüm dokümanları getir
    const timedExamsSnapshot = await adminDb
      .collection("timed_exams")
      .orderBy("createdAt", "desc")
      .get();

    const timedExams: TimedExamListItem[] = [];

    for (const doc of timedExamsSnapshot.docs) {
      const data = doc.data();

      // Sınav durumunu belirle
      const now = new Date();
      const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
      const endDate = data.endDate?.toDate?.() || new Date(data.endDate);

      let examStatus = "upcoming";
      if (now >= startDate && now <= endDate) {
        examStatus = "active";
      } else if (now > endDate) {
        examStatus = "completed";
      }

      // Katılımcı sayısını hesapla
      const rankingsSnapshot = await adminDb
        .collection("timed_exams")
        .doc(doc.id)
        .collection("rankings")
        .get();

      const totalParticipants = rankingsSnapshot.size;

      // Toplam soru sayısını hesapla
      const totalQuestions = data.questions?.length || 0;

      timedExams.push({
        id: doc.id,
        title: data.title || "Başlıksız Sınav",
        duration: data.duration || 0,
        startDate: startDate,
        endDate: endDate,
        isActive: data.isActive !== undefined ? data.isActive : true,
        totalParticipants,
        averageScore: data.averageScore || 0,
        totalQuestions,
      });
    }

    console.log(
      `Zamanlı sınavlar listesi hazırlandı: ${timedExams.length} sınav`
    );

    res.status(200).json({
      success: true,
      data: timedExams,
    });
  } catch (error) {
    console.error("Zamanlı sınavlar listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Zamanlı sınavlar listesi alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
