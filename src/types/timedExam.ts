import { Timestamp } from "firebase/firestore";

// Zamanlı Sınav Ana Dokümanı
export interface TimedExam {
  id: string;
  title: string;
  duration: number; // dakika
  startDate: Timestamp | Date;
  endDate: Timestamp | Date;
  isActive: boolean;
  averageScore: number;
  totalParticipants: number;
  totalScore: number;
  questions: TimedExamQuestion[];
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

// Zamanlı Sınav Sorusu
export interface TimedExamQuestion {
  questionText: string;
  correctAnswer: string;
  options: string[];
}

// Sıralama Alt Koleksiyonu
export interface TimedExamRanking {
  userId: string;
  userEmail: string;
  completionTime: Timestamp | Date;
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  wrongQuestions?: string[];
}

// Kullanıcı Deneme Geçmişi
export interface UserTimedExamAttempt {
  examId: string;
  status: "started" | "completed";
  startTime: Timestamp | Date;
  endTime?: Timestamp | Date;
  correctAnswers: number;
  totalQuestions: number;
  successRate: number;
}

// Zamanlı Sınav Oluşturma İsteği
export interface CreateTimedExamRequest {
  title: string;
  duration: number;
  startDate: Date;
  endDate: Date;
  questions: TimedExamQuestion[];
}

// Zamanlı Sınav Güncelleme İsteği
export interface UpdateTimedExamRequest {
  title?: string;
  duration?: number;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  questions?: TimedExamQuestion[];
}

// Zamanlı Sınav İstatistikleri
export interface TimedExamStats {
  totalExams: number;
  activeExams: number;
  totalParticipants: number;
  averageScore: number;
  totalQuestions: number;
}

// API Yanıt Tipleri
export interface TimedExamApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  message?: string;
}

// Zamanlı Sınav Listesi
export interface TimedExamListItem {
  id: string;
  title: string;
  duration: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  totalParticipants: number;
  averageScore: number;
  totalQuestions: number;
}

// Gerçek Zamanlı İzleme
export interface RealTimeExamMonitoring {
  examId: string;
  examTitle: string;
  currentParticipants: number;
  totalParticipants: number;
  averageProgress: number;
  recentSubmissions: TimedExamRanking[];
  examStatus: "upcoming" | "active" | "completed";
}

// Sınav Durumu
export type ExamStatus = "upcoming" | "active" | "completed";

// Sınav Filtreleme
export interface TimedExamFilters {
  status?: ExamStatus;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}
