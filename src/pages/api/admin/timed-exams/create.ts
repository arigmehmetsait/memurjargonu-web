import { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  CreateTimedExamRequest,
  TimedExamApiResponse,
  TimedExam,
} from "@/types/timedExam";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TimedExamApiResponse<{ id: string }>>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    const {
      title,
      duration,
      startDate,
      endDate,
      questions,
    }: CreateTimedExamRequest = req.body;

    // Validasyon
    if (!title || !duration || !startDate || !endDate || !questions) {
      return res.status(400).json({
        success: false,
        error: "Tüm alanlar zorunludur",
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "En az bir soru eklenmelidir",
      });
    }

    if (duration <= 0) {
      return res.status(400).json({
        success: false,
        error: "Süre 0'dan büyük olmalıdır",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: "Başlangıç tarihi bitiş tarihinden önce olmalıdır",
      });
    }

    // Soruları doğrula
    for (const question of questions) {
      if (
        !question.questionText ||
        !question.correctAnswer ||
        !question.options
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Tüm sorular geçerli metin, doğru cevap ve seçeneklere sahip olmalıdır",
        });
      }

      if (question.options.length < 2) {
        return res.status(400).json({
          success: false,
          error: "Her soru en az 2 seçeneğe sahip olmalıdır",
        });
      }

      if (!question.options.includes(question.correctAnswer)) {
        return res.status(400).json({
          success: false,
          error: "Doğru cevap seçenekler arasında bulunmalıdır",
        });
      }
    }

    // Yeni sınav dokümanını oluştur
    const newExam: Omit<TimedExam, "id"> = {
      title: title.trim(),
      duration,
      startDate: start,
      endDate: end,
      isActive: true,
      averageScore: 0,
      totalParticipants: 0,
      totalScore: 0,
      questions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("timed_exams").add(newExam);

    console.log(`Yeni zamanlı sınav oluşturuldu: ${docRef.id} - ${title}`);

    res.status(201).json({
      success: true,
      data: { id: docRef.id },
      message: "Zamanlı sınav başarıyla oluşturuldu",
    });
  } catch (error) {
    console.error("Zamanlı sınav oluşturulurken hata:", error);
    res.status(500).json({
      success: false,
      error: "Zamanlı sınav oluşturulamadı",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

