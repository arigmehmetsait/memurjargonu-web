import { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const YOUTUBE_BASE_URL = "https://www.youtube.com/watch?v=";

// YouTube URL'den video ID ve timestamp'i parse et
function parseYouTubeUrl(url: string): { videoId: string; timestamp?: string } | null {
  try {
    // Tam URL formatı: https://www.youtube.com/watch?v=VIDEO_ID&t=TIMESTAMP
    if (url.includes("youtube.com/watch?v=")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      const timestamp = urlObj.searchParams.get("t");
      
      if (videoId) {
        return {
          videoId,
          timestamp: timestamp || undefined,
        };
      }
    }
    
    // Sadece ID formatı: VIDEO_ID&t=TIMESTAMP veya sadece VIDEO_ID
    if (url.includes("&t=")) {
      const [videoId, timestampPart] = url.split("&t=");
      return {
        videoId: videoId.trim(),
        timestamp: timestampPart?.trim(),
      };
    }
    
    // Sadece video ID
    return {
      videoId: url.trim(),
    };
  } catch (e) {
    return null;
  }
}

// Video ID ve timestamp'ten tam URL oluştur
function buildYouTubeUrl(videoId: string, timestamp?: string): string {
  let url = `${YOUTUBE_BASE_URL}${videoId}`;
  if (timestamp) {
    url += `&t=${timestamp}`;
  }
  return url;
}

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

    const docRef = adminDb.collection("EgitimVideos").doc(docId);

    // GET - Videoları listele
    if (req.method === "GET") {
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doküman bulunamadı",
        });
      }

      const data = doc.data();
      const videoKeys = Object.keys(data || {}).filter(
        (key) => key !== "createdAt" && key !== "updatedAt"
      );

      const videos = videoKeys.map((key) => {
        const videoData = data?.[key] || {};
        const videoId = videoData.videoId || key;
        const timestamp = videoData.timestamp;
        
        return {
          id: key,
          videoId,
          timestamp,
          fullUrl: buildYouTubeUrl(videoId, timestamp),
          ...videoData,
        };
      });

      return res.status(200).json({
        success: true,
        data: videos,
      });
    }

    // POST - Yeni video ekle
    if (req.method === "POST") {
      const { title, description, instructor, subject, videoUrl } = req.body;

      if (!title || !videoUrl) {
        return res.status(400).json({
          success: false,
          error: "Başlık ve video URL gereklidir",
        });
      }

      const parsed = parseYouTubeUrl(videoUrl);
      if (!parsed) {
        return res.status(400).json({
          success: false,
          error: "Geçersiz YouTube URL formatı",
        });
      }

      // Firestore otomatik ID oluştur
      const tempRef = adminDb.collection("_temp").doc();
      const videoId = tempRef.id;
      await tempRef.delete(); // Geçici dokümanı hemen sil

      const videoData: any = {
        title: title.trim(),
        description: description?.trim() || "",
        instructor: instructor?.trim() || "",
        subject: subject?.trim() || "",
        videoId: parsed.videoId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Timestamp varsa ekle, yoksa ekleme (undefined Firestore'da kabul edilmez)
      if (parsed.timestamp) {
        videoData.timestamp = parsed.timestamp;
      }

      // Doküman içine nested object olarak ekle
      await docRef.update({
        [videoId]: videoData,
        updatedAt: new Date(),
      });

      console.log(`Yeni video eklendi: ${videoId} - ${docId}`);

      return res.status(201).json({
        success: true,
        data: {
          id: videoId,
          ...videoData,
          fullUrl: buildYouTubeUrl(parsed.videoId, parsed.timestamp),
        },
        message: "Video başarıyla eklendi",
      });
    }

    // PUT - Video güncelle
    if (req.method === "PUT") {
      const { videoId: updateVideoId, title, description, instructor, subject, videoUrl } = req.body;

      if (!updateVideoId) {
        return res.status(400).json({
          success: false,
          error: "Video ID gereklidir",
        });
      }

      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doküman bulunamadı",
        });
      }

      const data = doc.data();
      if (!data || !data[updateVideoId]) {
        return res.status(404).json({
          success: false,
          error: "Video bulunamadı",
        });
      }

      // Mevcut video verisini al
      const currentVideo = data[updateVideoId] || {};
      
      // Güncellenmiş video verisini oluştur
      const updatedVideo: any = {
        ...currentVideo,
        updatedAt: new Date(),
      };

      if (title !== undefined) updatedVideo.title = title.trim();
      if (description !== undefined) updatedVideo.description = description?.trim() || "";
      if (instructor !== undefined) updatedVideo.instructor = instructor?.trim() || "";
      if (subject !== undefined) updatedVideo.subject = subject?.trim() || "";

      if (videoUrl) {
        const parsed = parseYouTubeUrl(videoUrl);
        if (!parsed) {
          return res.status(400).json({
            success: false,
            error: "Geçersiz YouTube URL formatı",
          });
        }
        updatedVideo.videoId = parsed.videoId;
        // Timestamp varsa ekle, yoksa mevcut timestamp'i koru (undefined gönderme)
        if (parsed.timestamp) {
          updatedVideo.timestamp = parsed.timestamp;
        } else if (currentVideo.timestamp) {
          // Yeni timestamp yok ama eskisi varsa, eskisini koru
          updatedVideo.timestamp = currentVideo.timestamp;
        }
        // Eğer ne yeni ne de eski timestamp yoksa, hiçbir şey ekleme
      }

      // Firestore'da nested object olarak güncelle
      await docRef.update({
        [updateVideoId]: updatedVideo,
        updatedAt: new Date(),
      });

      console.log(`Video güncellendi: ${updateVideoId} - ${docId}`);

      return res.status(200).json({
        success: true,
        message: "Video başarıyla güncellendi",
      });
    }

    // DELETE - Video sil
    if (req.method === "DELETE") {
      const { videoId: deleteVideoId } = req.query;

      if (!deleteVideoId || typeof deleteVideoId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Video ID gereklidir",
        });
      }

      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: "Doküman bulunamadı",
        });
      }

      const data = doc.data();
      if (!data || !data[deleteVideoId]) {
        return res.status(404).json({
          success: false,
          error: "Video bulunamadı",
        });
      }

      // Field'ı silmek için FieldValue.delete() kullan
      const updateData: any = {
        updatedAt: new Date(),
      };
      updateData[deleteVideoId] = FieldValue.delete();
      
      await docRef.update(updateData);

      console.log(`Video silindi: ${deleteVideoId} - ${docId}`);

      return res.status(200).json({
        success: true,
        message: "Video başarıyla silindi",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Video işlemi hatası:", error);
    return res.status(500).json({
      success: false,
      error: "İşlem sırasında hata oluştu",
      details: error instanceof Error ? error.message : "Bilinmeyen hata",
    });
  }
}

