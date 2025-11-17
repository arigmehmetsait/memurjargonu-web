import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  TimedExamApiResponse,
  TimedExamRanking,
  RealTimeExamMonitoring,
} from "@/types/timedExam";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    TimedExamApiResponse<TimedExamRanking[] | RealTimeExamMonitoring>
  >
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const { examId, realtime } = req.query;

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

    const examData = examDoc.data();
    const now = new Date();
    const startDate =
      examData?.startDate?.toDate?.() || new Date(examData?.startDate);
    const endDate =
      examData?.endDate?.toDate?.() || new Date(examData?.endDate);

    // Rankings alt koleksiyonunu getir (composite index kullanarak)
    const rankingsSnapshot = await adminDb
      .collection("timed_exams")
      .doc(examId)
      .collection("rankings")
      .orderBy("score", "desc")
      .orderBy("completionTime", "asc")
      .get();

    const rankings: TimedExamRanking[] = rankingsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: data.userId,
        userEmail: data.userEmail,
        completionTime:
          data.completionTime?.toDate?.() || new Date(data.completionTime),
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        score: data.score,
        wrongQuestions: data.wrongQuestions || [],
      };
    });

    // Eğer realtime isteniyorsa, monitoring verilerini de ekle
    if (realtime === "true") {
      const currentParticipants = rankings.length;
      const totalQuestions = examData?.questions?.length || 0;

      // Ortalama ilerleme hesapla (tamamlanan sınavlar için)
      const averageProgress =
        currentParticipants > 0
          ? (rankings.reduce(
              (sum, ranking) => sum + ranking.correctAnswers / totalQuestions,
              0
            ) /
              currentParticipants) *
            100
          : 0;

      // Sınav durumunu belirle
      let examStatus: "upcoming" | "active" | "completed" = "upcoming";
      if (now >= startDate && now <= endDate) {
        examStatus = "active";
      } else if (now > endDate) {
        examStatus = "completed";
      }

      const monitoring: RealTimeExamMonitoring = {
        examId,
        examTitle: examData?.title || "Başlıksız Sınav",
        currentParticipants,
        totalParticipants: currentParticipants,
        averageProgress,
        recentSubmissions: rankings.slice(0, 10), // Son 10 sonuç
        examStatus,
      };

      res.status(200).json({
        success: true,
        data: monitoring,
      });
    } else {
      res.status(200).json({
        success: true,
        data: rankings,
      });
    }
  } catch (error) {
    console.error("Sınav sıralaması alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: "Sınav sıralaması alınamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}
