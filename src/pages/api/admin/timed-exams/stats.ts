import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import { TimedExamApiResponse, TimedExamStats } from "@/types/timedExam";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TimedExamApiResponse<TimedExamStats>>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Tüm zamanlı sınavları getir
    const timedExamsSnapshot = await adminDb.collection("timed_exams").get();

    let totalExams = 0;
    let activeExams = 0;
    let totalParticipants = 0;
    let totalScore = 0;
    let totalQuestions = 0;
    const now = new Date();

    for (const doc of timedExamsSnapshot.docs) {
      const data = doc.data();
      totalExams++;

      // Sınav durumunu belirle
      const startDate = data.startDate?.toDate?.() || new Date(data.startDate);
      const endDate = data.endDate?.toDate?.() || new Date(data.endDate);

      // Aktif sınav kontrolü (başlamış ve bitmemiş)
      if (data.isActive && now >= startDate && now <= endDate) {
        activeExams++;
      }

      // Katılımcı sayısını hesapla
      const rankingsSnapshot = await adminDb
        .collection("timed_exams")
        .doc(doc.id)
        .collection("rankings")
        .get();

      const examParticipants = rankingsSnapshot.size;
      totalParticipants += examParticipants;

      // Toplam puan hesapla
      let examTotalScore = 0;
      rankingsSnapshot.docs.forEach((rankingDoc) => {
        const rankingData = rankingDoc.data();
        examTotalScore += rankingData.score || 0;
      });

      totalScore += examTotalScore;

      // Toplam soru sayısı
      totalQuestions += data.questions?.length || 0;
    }

    const averageScore =
      totalParticipants > 0 ? totalScore / totalParticipants : 0;

    const stats: TimedExamStats = {
      totalExams,
      activeExams,
      totalParticipants,
      averageScore: Math.round(averageScore * 100) / 100, // 2 ondalık basamak
      totalQuestions,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Zamanlı sınav istatistikleri alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "İstatistikler alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
