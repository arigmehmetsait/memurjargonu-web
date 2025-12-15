import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import LoadingSpinner from "@/components/LoadingSpinner";
import CustomModal from "@/components/CustomModal";
import ConfirmModal from "@/components/ConfirmModal";
import ExcelImportModal from "@/components/ExcelImportModal";
import { getValidToken } from "@/utils/tokenCache";
import { getDenemeConfig } from "@/utils/denemeRouting";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

interface Soru {
  id: string;
  soru: string;
  cevap: string;
  secenekler: string[];
  dogruSecenek: number;
  aciklama: string;
  zorluk: string;
  konu: string;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

interface DenemeData {
  denemeId: string;
  denemeName: string;
  sorular: Soru[];
  totalCount: number;
}

interface AdminSorularPageProps {
  denemeType: string;
}

export default function AdminSorularPage({
  denemeType,
}: AdminSorularPageProps) {
  const router = useRouter();
  const { denemeId, collection } = router.query;
  const collectionName = typeof collection === "string" ? collection : "sorular";

  const config = getDenemeConfig(denemeType);

  const [denemeData, setDenemeData] = useState<DenemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state'leri
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedSoru, setSelectedSoru] = useState<Soru | null>(null);
  const [importing, setImporting] = useState(false);

  // Düzenleme formu state'i
  const [editForm, setEditForm] = useState({
    soru: "",
    cevap: "",
    secenekler: ["", "", "", "", ""],
    dogruSecenek: 0,
    aciklama: "",
    zorluk: "orta",
    konu: "",
  });

  // Yeni soru ekleme formu state'i
  const [newSoruForm, setNewSoruForm] = useState({
    soru: "",
    cevap: "",
    secenekler: ["", "", "", "", ""],
    dogruSecenek: 0,
    aciklama: "",
    zorluk: "orta",
    konu: "",
  });

  const excelModalConfig = (() => {
    const dogruYanlisConfig = {
      title: "Excel'den Toplu Soru Ekle",
      description:
        "Doğru-Yanlış sorularını Excel dosyasından toplu olarak içe aktarabilirsiniz.",
      columns: [
        {
          name: "soru",
          required: true,
          description: "Soru metni",
        },
        {
          name: "cevap",
          required: true,
          description: 'Doğru cevap: "Doğru" veya "Yanlış"',
        },
        {
          name: "aciklama",
          required: false,
          description: "Cevap açıklaması (opsiyonel)",
        },
        {
          name: "zorluk",
          required: false,
          description:
            'Zorluk seviyesi: "kolay", "orta" veya "zor" (opsiyonel)',
        },
        {
          name: "konu",
          required: false,
          description: "Konu (opsiyonel, varsayılan: deneme türüne göre)",
        },
      ],
      exampleData: [
        {
          soru: "Türkiye'nin başkenti Ankara'dır.",
          cevap: "Doğru",
          aciklama: "Türkiye'nin başkenti 1923'ten beri Ankara'dır.",
          zorluk: "kolay",
          konu: config.defaultKonu,
        },
        {
          soru: "KPSS sınavı yılda iki kez yapılır.",
          cevap: "Yanlış",
          aciklama: "KPSS sınavı genellikle yılda bir kez yapılır.",
          zorluk: "orta",
          konu: config.defaultKonu,
        },
      ],
      accept: ".xlsx,.xls",
      buttonText: "Soruları İçe Aktar",
      buttonIcon: "bi-file-earmark-spreadsheet",
    };

    if (denemeType === "boslukdoldurma") {
      return {
        title: "Excel'den Boşluk Doldurma Ekle",
        description:
          "Boşluk doldurma sorularını Excel dosyasından toplu olarak içe aktarabilirsiniz. Her soru için en az iki seçenek girin ve doğru cevabı işaretleyin.",
        columns: [
          {
            name: "soru",
            required: true,
            description: "Boşluk doldurma soru metni",
          },
          {
            name: "secenek_a",
            required: true,
            description: "A seçeneği",
          },
          {
            name: "secenek_b",
            required: true,
            description: "B seçeneği",
          },
          {
            name: "secenek_c",
            required: false,
            description: "C seçeneği (opsiyonel)",
          },
          {
            name: "secenek_d",
            required: false,
            description: "D seçeneği (opsiyonel)",
          },
          {
            name: "dogrucevap",
            required: true,
            description: "Doğru seçeneğin metni",
          },
          {
            name: "aciklama",
            required: false,
            description: "Açıklama (opsiyonel)",
          },
          {
            name: "zorluk",
            required: false,
            description: 'Zorluk seviyesi: "kolay", "orta" veya "zor"',
          },
          {
            name: "konu",
            required: false,
            description: "Konu (opsiyonel, varsayılan: deneme türüne göre)",
          },
        ],
        exampleData: [
          {
            soru: "________ sonucunda Avrupa Hun Devleti kurulmuştur?",
            secenek_a: "Kavimler Göçü",
            secenek_b: "Malazgirt Savaşı",
            secenek_c: "Haçlı Seferleri",
            secenek_d: "",
            dogrucevap: "Kavimler Göçü",
            aciklama: "Kavimler Göçü sonrası Avrupa Hun Devleti kuruldu.",
            zorluk: "orta",
            konu: config.defaultKonu,
          },
        ],
        accept: ".xlsx,.xls",
        buttonText: "Soruları İçe Aktar",
        buttonIcon: "bi-file-earmark-spreadsheet",
      };
    }

    // Mevzuat, Coğrafya, Tarih, Genel için çoktan seçmeli format
    if (denemeType === "mevzuat" || denemeType === "cografya" || denemeType === "tarih" || denemeType === "genel") {
      return {
        title: "Excel'den Toplu Soru Ekle",
        description:
          "Çoktan seçmeli soruları Excel dosyasından toplu olarak içe aktarabilirsiniz. Her soru için en az iki seçenek girin ve doğru cevabı işaretleyin.",
        columns: [
          {
            name: "soru",
            required: true,
            description: "Soru metni",
          },
          {
            name: "secenek_a",
            required: true,
            description: "A seçeneği",
          },
          {
            name: "secenek_b",
            required: true,
            description: "B seçeneği",
          },
          {
            name: "secenek_c",
            required: false,
            description: "C seçeneği (opsiyonel)",
          },
          {
            name: "secenek_d",
            required: false,
            description: "D seçeneği (opsiyonel)",
          },
          {
            name: "secenek_e",
            required: false,
            description: "E seçeneği (opsiyonel)",
          },
          {
            name: "dogrucevap",
            required: true,
            description: "Doğru seçeneğin metni",
          },
          {
            name: "aciklama",
            required: false,
            description: "Açıklama (opsiyonel)",
          },
          {
            name: "zorluk",
            required: false,
            description: 'Zorluk seviyesi: "kolay", "orta" veya "zor"',
          },
          {
            name: "konu",
            required: false,
            description: "Konu (opsiyonel, varsayılan: deneme türüne göre)",
          },
        ],
        exampleData: [
          {
            soru: "Aşağıdakilerden hangisi Türkiye'nin başkentidir?",
            secenek_a: "İstanbul",
            secenek_b: "Ankara",
            secenek_c: "İzmir",
            secenek_d: "Bursa",
            secenek_e: "",
            dogrucevap: "Ankara",
            aciklama: "Türkiye'nin başkenti 1923'ten beri Ankara'dır.",
            zorluk: "kolay",
            konu: config.defaultKonu,
          },
        ],
        accept: ".xlsx,.xls",
        buttonText: "Soruları İçe Aktar",
        buttonIcon: "bi-file-earmark-spreadsheet",
      };
    }

    return dogruYanlisConfig;
  })();

  useEffect(() => {
    if (denemeId && typeof denemeId === "string") {
      fetchSorular();
    }
  }, [denemeId, denemeType, collectionName]);

  const fetchSorular = async () => {
    if (!denemeId || typeof denemeId !== "string") return;

    try {
      setLoading(true);
      setError(null);

      console.log("Sorular API'sine istek gönderiliyor...", { collectionName });
      const response = await fetch(
        `${config.apiPath}/${denemeId}/sorular?collection=${encodeURIComponent(collectionName)}`
      );
      const data = await response.json();

      console.log("Sorular API yanıtı:", data);

      if (data.success) {
        setDenemeData(data.data);
        console.log("Sorular başarıyla yüklendi:", data.data);
      } else {
        setError(data.error || "Sorular yüklenemedi");
        console.error("API hatası:", data);
      }
    } catch (err) {
      console.error("Sorular yüklenirken hata:", err);
      setError(
        "Sorular yüklenirken bir hata oluştu: " +
          (err instanceof Error ? err.message : "Bilinmeyen hata")
      );
    } finally {
      setLoading(false);
    }
  };

  const getZorlukBadgeClass = (zorluk: string) => {
    switch (zorluk.toLowerCase()) {
      case "kolay":
        return "bg-success";
      case "orta":
        return "bg-warning";
      case "zor":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const getZorlukText = (zorluk: string) => {
    switch (zorluk.toLowerCase()) {
      case "kolay":
        return "Kolay";
      case "orta":
        return "Orta";
      case "zor":
        return "Zor";
      default:
        return "Belirtilmemiş";
    }
  };

  // Soru işlem fonksiyonları
  const handleViewSoru = (soru: Soru) => {
    setSelectedSoru(soru);
    setIsViewModalOpen(true);
  };

  const handleEditSoru = (soru: Soru) => {
    setSelectedSoru(soru);
    // Doğru-yanlış soruları için seçenekleri otomatik doldur
    if (denemeType === "dogruyanlis") {
      setEditForm({
        soru: soru.soru,
        cevap: soru.cevap,
        secenekler: ["Doğru", "Yanlış"],
        dogruSecenek: soru.dogruSecenek,
        aciklama: soru.aciklama,
        zorluk: soru.zorluk,
        konu: config.defaultKonu, // Deneme türüne göre konu
      });
    } else {
      let dogruSecenek = soru.dogruSecenek;
      if (denemeType === "boslukdoldurma" && soru.secenekler.length > 0) {
        const correctIndex = soru.secenekler.findIndex(
          (secenek) =>
            secenek.trim().toLowerCase() === soru.cevap.trim().toLowerCase()
        );
        if (correctIndex >= 0) {
          dogruSecenek = correctIndex;
        }
      }

        // Firebase'den gelen options'lardan prefix'leri kaldır (eğer varsa)
        const cleanedOptions = soru.secenekler.map((opt: string) => {
          return opt.replace(/^[A-E]\)\s*/, "");
        });

        // Eğer 5'ten az seçenek varsa, boş string'lerle doldur
        const paddedOptions = [...cleanedOptions];
        while (paddedOptions.length < 5) {
          paddedOptions.push("");
        }

        // Firebase'den gelen correctAnswer'dan prefix'i kaldır (eğer varsa)
        const cleanedCevap = soru.cevap.replace(/^[A-E]\)\s*/, "");

      setEditForm({
        soru: soru.soru,
          cevap: cleanedCevap,
          secenekler: paddedOptions.slice(0, 5),
        dogruSecenek,
        aciklama: soru.aciklama,
        zorluk: soru.zorluk,
        konu: config.defaultKonu, // Deneme türüne göre konu
      });
    }
    setIsEditModalOpen(true);
  };

  const handleDeleteSoru = (soru: Soru) => {
    setSelectedSoru(soru);
    setIsDeleteModalOpen(true);
  };

  const updateSoru = async () => {
    if (!selectedSoru || !denemeId) return;

    try {
      setLoading(true);
      const token = await getValidToken();

      // Doğru-yanlış soruları için resimdeki modele göre sadece text ve correct gönder
      let requestBody;
      if (denemeType === "dogruyanlis") {
        requestBody = {
          text: editForm.soru.trim(),
          correct: editForm.dogruSecenek === 0 ? "Doğru" : "Yanlış",
          description: editForm.aciklama?.trim() || "",
          subject: editForm.konu?.trim() || config.defaultKonu,
        };
      } else if (denemeType === "boslukdoldurma") {
        const trimmedOptions = editForm.secenekler
          .map((secenek) => secenek.trim())
          .filter((secenek) => secenek.length > 0);
        const correctAnswer =
          editForm.secenekler[editForm.dogruSecenek]?.trim() || "";

        requestBody = {
          questionText: editForm.soru.trim(),
          correctAnswer,
          options: trimmedOptions,
          description: editForm.aciklama?.trim() || "",
          difficulty: editForm.zorluk,
          subject: editForm.konu?.trim() || config.defaultKonu,
        };
      } else {
        // Mevzuat, Coğrafya, Tarih, Genel için Firebase formatı
        const trimmedOptions = editForm.secenekler
          .map((secenek) => secenek.trim())
          .filter((secenek) => secenek.length > 0);

        // Options'ları "A)", "B)", "C)", "D)", "E)" prefix'leriyle Firebase'e gönder
        const optionsWithPrefix = trimmedOptions.map((opt, index) => {
          const prefix = String.fromCharCode(65 + index) + ") ";
          // Eğer zaten prefix varsa kaldır, yoksa ekle
          const cleanOpt = opt.replace(/^[A-E]\)\s*/, "");
          return prefix + cleanOpt;
        });

        // CorrectAnswer'ı da prefix'li yap (seçilen seçeneğin prefix'li versiyonu)
        const correctAnswerIndex = editForm.dogruSecenek;
        const correctAnswerPrefix = String.fromCharCode(65 + correctAnswerIndex) + ") ";
        const cleanCorrectAnswer = editForm.cevap.trim().replace(/^[A-E]\)\s*/, "");
        const correctAnswerWithPrefix = correctAnswerPrefix + cleanCorrectAnswer;

        requestBody = {
          questionText: editForm.soru.trim(),
          correctAnswer: correctAnswerWithPrefix,
          options: optionsWithPrefix,
          description: editForm.aciklama?.trim() || "",
          difficulty: editForm.zorluk,
          subject: editForm.konu?.trim() || config.defaultKonu,
        };
      }

      const response = await fetch(
        `${config.adminApiPath}/${denemeId}/sorular/${selectedSoru.id}?collection=${encodeURIComponent(collectionName)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...requestBody, collection: collectionName }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSorular(); // Listeyi yenile
        setIsEditModalOpen(false);
        setSelectedSoru(null);
      } else {
        setError(data.error || "Soru güncellenemedi");
      }
    } catch (err) {
      console.error("Soru güncellenirken hata:", err);
      setError("Soru güncellenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const deleteSoru = async () => {
    if (!selectedSoru || !denemeId) return;

    try {
      setLoading(true);
      const token = await getValidToken();

      const response = await fetch(
        `${config.adminApiPath}/${denemeId}/sorular/${selectedSoru.id}?collection=${encodeURIComponent(collectionName)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchSorular(); // Listeyi yenile
        setIsDeleteModalOpen(false);
        setSelectedSoru(null);
      } else {
        setError(data.error || "Soru silinemedi");
      }
    } catch (err) {
      console.error("Soru silinirken hata:", err);
      setError("Soru silinirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSoru = () => {
    // Formu sıfırla ve konuyu otomatik doldur
    // Doğru-yanlış için seçenekleri otomatik doldur
    if (denemeType === "dogruyanlis") {
      setNewSoruForm({
        soru: "",
        cevap: "",
        secenekler: ["Doğru", "Yanlış"],
        dogruSecenek: 0,
        aciklama: "",
        zorluk: "orta",
        konu: config.defaultKonu,
      });
    } else {
      setNewSoruForm({
        soru: "",
        cevap: "",
        secenekler: ["", "", "", "", ""],
        dogruSecenek: 0,
        aciklama: "",
        zorluk: "orta",
        konu: config.defaultKonu,
      });
    }
    setIsAddModalOpen(true);
  };

  const addNewSoru = async () => {
    if (!denemeId) return;

    const trimmedSoru = newSoruForm.soru.trim();
    const trimmedCevap = newSoruForm.cevap.trim();
    const trimmedKonu = newSoruForm.konu.trim() || config.defaultKonu;
    const trimmedAciklama = newSoruForm.aciklama?.trim() || "";
    const trimmedSecenekler = newSoruForm.secenekler.map((sec) => sec.trim());
    const filledSecenekler = trimmedSecenekler.filter((sec) => sec !== "");
    const selectedOption = trimmedSecenekler[newSoruForm.dogruSecenek] || "";

    // Doğru-yanlış soruları için özel validasyon
    if (denemeType === "dogruyanlis") {
      if (!trimmedSoru) {
        setError("Lütfen soru metnini girin.");
        return;
      }
      if (newSoruForm.dogruSecenek !== 0 && newSoruForm.dogruSecenek !== 1) {
        setError("Lütfen doğru cevabı seçin.");
        return;
      }
    } else if (denemeType === "boslukdoldurma") {
      if (!trimmedSoru) {
        setError("Lütfen soru metnini girin.");
        return;
      }
      if (filledSecenekler.length < 2) {
        setError("En az 2 seçenek doldurulmalıdır.");
        return;
      }
      if (!selectedOption) {
        setError("Lütfen doğru cevabı seçin ve doldurun.");
        return;
      }
    } else {
      // Diğer deneme türleri için normal validasyon
      if (!trimmedSoru || !trimmedCevap || !trimmedKonu) {
        setError("Lütfen tüm zorunlu alanları doldurun.");
        return;
      }

      // En az 2 seçenek olmalı
      if (filledSecenekler.length < 2) {
        setError("En az 2 seçenek doldurulmalıdır.");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      toast.info("Soru ekleniyor...", { autoClose: false });
      const token = await getValidToken();

      // Doğru-yanlış soruları için resimdeki modele göre sadece text ve correct gönder
      let requestBody;
      if (denemeType === "dogruyanlis") {
        requestBody = {
          text: trimmedSoru,
          correct: newSoruForm.dogruSecenek === 0 ? "Doğru" : "Yanlış",
          subject: trimmedKonu,
          description: trimmedAciklama,
        };
      } else if (denemeType === "boslukdoldurma") {
        requestBody = {
          questionText: trimmedSoru,
          correctAnswer: selectedOption,
          options: filledSecenekler,
          description: trimmedAciklama,
          difficulty: newSoruForm.zorluk,
          subject: trimmedKonu,
        };
      } else {
        // Mevzuat, Coğrafya, Tarih, Genel için Firebase formatı
        // Options'ları "A)", "B)", "C)", "D)", "E)" prefix'leriyle Firebase'e gönder
        const optionsWithPrefix = filledSecenekler.map((opt, index) => {
          const prefix = String.fromCharCode(65 + index) + ") ";
          // Eğer zaten prefix varsa kaldır, yoksa ekle
          const cleanOpt = opt.replace(/^[A-E]\)\s*/, "");
          return prefix + cleanOpt;
        });

        // CorrectAnswer'ı da prefix'li yap (seçilen seçeneğin prefix'li versiyonu)
        const correctAnswerIndex = newSoruForm.dogruSecenek;
        const correctAnswerPrefix = String.fromCharCode(65 + correctAnswerIndex) + ") ";
        const cleanCorrectAnswer = trimmedCevap.replace(/^[A-E]\)\s*/, "");
        const correctAnswerWithPrefix = correctAnswerPrefix + cleanCorrectAnswer;

        requestBody = {
          questionText: trimmedSoru,
          correctAnswer: correctAnswerWithPrefix,
          options: optionsWithPrefix,
          description: trimmedAciklama || "",
          difficulty: newSoruForm.zorluk,
          subject: trimmedKonu,
        };
      }

      const response = await fetch(
        `${config.adminApiPath}/${denemeId}/sorular?collection=${encodeURIComponent(collectionName)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...requestBody, collection: collectionName }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.dismiss(); // Yükleniyor toast'unu kapat
        toast.success("Soru başarıyla eklendi!");
        await fetchSorular(); // Listeyi yenile
        setIsAddModalOpen(false);
        // Doğru-yanlış için seçenekleri otomatik doldur
        if (denemeType === "dogruyanlis") {
          setNewSoruForm({
            soru: "",
            cevap: "",
            secenekler: ["Doğru", "Yanlış"],
            dogruSecenek: 0,
            aciklama: "",
            zorluk: "orta",
            konu: config.defaultKonu,
          });
        } else {
          setNewSoruForm({
            soru: "",
            cevap: "",
            secenekler: ["", "", "", ""],
            dogruSecenek: 0,
            aciklama: "",
            zorluk: "orta",
            konu: config.defaultKonu,
          });
        }
      } else {
        toast.dismiss(); // Yükleniyor toast'unu kapat
        setError(data.error || "Soru eklenemedi");
        toast.error(data.error || "Soru eklenemedi");
      }
    } catch (err) {
      console.error("Soru eklenirken hata:", err);
      toast.dismiss(); // Yükleniyor toast'unu kapat
      setError("Soru eklenirken bir hata oluştu");
      toast.error("Soru eklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const closeModals = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsAddModalOpen(false);
    setShowExcelModal(false);
    setSelectedSoru(null);
  };

  const handleExcelExport = () => {
    if (!denemeData) {
      toast.warn("Önce soru verilerini yükleyin.");
      return;
    }

    const hasSorular = denemeData.sorular.length > 0;

    // Doğru-yanlış için import schema'ya uygun export
    let exportRows: Array<Record<string, string>>;

    if (denemeType === "dogruyanlis") {
      // Doğru-yanlış için import formatına uygun: soru, cevap, aciklama, zorluk, konu
      exportRows = hasSorular
        ? denemeData.sorular.map((soru) => ({
            soru: soru.soru || "",
            cevap: soru.cevap || "",
            aciklama: soru.aciklama || "",
            zorluk: soru.zorluk || "orta",
            konu: soru.konu || config.defaultKonu,
          }))
        : [
            {
              soru: "",
              cevap: "",
              aciklama: "",
              zorluk: "",
              konu: config.defaultKonu,
            },
          ];
    } else if (denemeType === "boslukdoldurma") {
      // Boşluk doldurma için import formatına uygun: soru, dogrucevap, secenek_a, secenek_b, vb., aciklama, zorluk, konu
      const optionHeaders = ["a", "b", "c", "d", "e", "f"];

      exportRows = hasSorular
        ? denemeData.sorular.map((soru) => {
            const row: Record<string, string> = {
              soru: soru.soru || "",
              dogrucevap: soru.cevap || "",
              aciklama: soru.aciklama || "",
              zorluk: soru.zorluk || "orta",
              konu: soru.konu || config.defaultKonu,
            };

            // Options'lardan prefix'leri kaldır ve export et
            optionHeaders.forEach((header, index) => {
              const secenek = soru.secenekler[index] || "";
              // Prefix'i kaldır (A), B), C), D), E), F) formatından)
              const cleanSecenek = secenek.replace(/^[A-F]\)\s*/, "");
              row[`secenek_${header}`] = cleanSecenek;
            });

            // dogrucevap'tan da prefix'i kaldır
            row.dogrucevap = row.dogrucevap.replace(/^[A-F]\)\s*/, "");

            return row;
          })
        : [
            optionHeaders.reduce(
              (acc, header) => ({
                ...acc,
                [`secenek_${header}`]: "",
              }),
              {
                soru: "",
                dogrucevap: "",
                aciklama: "",
                zorluk: "",
                konu: config.defaultKonu,
              }
            ),
          ];
    } else {
      // Mevzuat, Coğrafya, Tarih, Genel için import formatına uygun: soru, secenek_a, secenek_b, secenek_c, secenek_d, secenek_e, dogrucevap, aciklama, zorluk, konu
      const optionHeaders = ["a", "b", "c", "d", "e"];

      exportRows = hasSorular
        ? denemeData.sorular.map((soru) => {
            const row: Record<string, string> = {
            soru: soru.soru || "",
            dogrucevap: soru.cevap || "",
            aciklama: soru.aciklama || "",
            zorluk: soru.zorluk || "orta",
            konu: soru.konu || config.defaultKonu,
            };

            // Options'lardan prefix'leri kaldır ve export et
            soru.secenekler.forEach((secenek: string, index: number) => {
              if (index < optionHeaders.length) {
                // Prefix'i kaldır (A), B), C), D), E) formatından)
                const cleanSecenek = secenek.replace(/^[A-E]\)\s*/, "");
                row[`secenek_${optionHeaders[index]}`] = cleanSecenek;
              }
            });

            // Eğer 5'ten az seçenek varsa, boş string'lerle doldur
            for (let i = soru.secenekler.length; i < optionHeaders.length; i++) {
              row[`secenek_${optionHeaders[i]}`] = "";
            }

            // dogrucevap'tan da prefix'i kaldır
            row.dogrucevap = row.dogrucevap.replace(/^[A-E]\)\s*/, "");

            return row;
          })
        : [
            optionHeaders.reduce(
              (acc, header) => ({
                ...acc,
                [`secenek_${header}`]: "",
              }),
            {
              soru: "",
              dogrucevap: "",
              aciklama: "",
              zorluk: "",
              konu: config.defaultKonu,
              }
            ),
          ];
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sorular");

    const defaultSlug =
      denemeType === "dogruyanlis"
        ? "dogru-yanlis-sorulari"
        : denemeType === "boslukdoldurma"
        ? "bosluk-doldurma-sorulari"
        : "deneme-sorulari";

    const fileName = `${
      denemeData.denemeName?.replace(/[<>:"/\\|?*]+/g, "-") || defaultSlug
    }-${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    toast.success(
      hasSorular
        ? "Sorular Excel olarak indirildi."
        : "Boş şablon Excel olarak indirildi."
    );
  };

  const handleExcelImport = async (file: File) => {
    if (!file || !denemeId) return;

    let loadingToastId: number | string | undefined;
    try {
      setImporting(true);
      loadingToastId = toast.info("Sorular yükleniyor...", { autoClose: false });
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        if (loadingToastId) toast.dismiss(loadingToastId);
        toast.error("Excel dosyasında sayfa bulunamadı");
        setImporting(false);
        return;
      }

      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
      });

      const token = await getValidToken();
      let successCount = 0;
      let errorCount = 0;

      const extractBoslukOptions = (normalized: Record<string, any>) => {
        const optionBuckets = [
          [
            "secenek_a",
            "secenek_b",
            "secenek_c",
            "secenek_d",
            "secenek_e",
            "secenek_f",
          ],
          [
            "secenek1",
            "secenek2",
            "secenek3",
            "secenek4",
            "secenek5",
            "secenek6",
          ],
          ["option1", "option2", "option3", "option4", "option5", "option6"],
        ];

        const seen = new Set<string>();
        const result: string[] = [];

        const pushOption = (value: unknown) => {
          if (value === undefined || value === null) return;
          const trimmed = String(value).trim();
          if (!trimmed) return;
          const key = trimmed.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          result.push(trimmed);
        };

        optionBuckets.forEach((bucket) =>
          bucket.forEach((key) => pushOption(normalized[key]))
        );

        const listField =
          normalized["secenekler"] ||
          normalized["options"] ||
          normalized["seçenekler"];

        if (Array.isArray(listField)) {
          listField.forEach(pushOption);
        } else if (typeof listField === "string") {
          listField
            .split(/[|;,]/)
            .map((part) => part.trim())
            .forEach(pushOption);
        }

        return result;
      };

      for (const row of rows) {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          normalized[key.trim().toLowerCase()] = row[key];
        });

        const questionText = String(
          normalized["soru"] || normalized["questiontext"] || ""
        ).trim();
        const rawAnswer = String(
          normalized["dogrucevap"] ||
            normalized["correctanswer"] ||
            normalized["cevap"] ||
            ""
        ).trim();
        const lowerAnswer = rawAnswer.toLowerCase();
        const explanation = String(
          normalized["aciklama"] ||
            normalized["explanation"] ||
            normalized["açıklama"] ||
            ""
        ).trim();
        const difficulty = String(
          normalized["zorluk"] ||
            normalized["difficulty"] ||
            normalized["seviye"] ||
            "orta"
        )
          .trim()
          .toLowerCase();
        const subject =
          String(
            normalized["konu"] ||
              normalized["subject"] ||
              normalized["topic"] ||
              ""
          ).trim() || config.defaultKonu;

        if (!questionText) {
          continue;
        }

        // Zorluk değerini normalize et
        let finalDifficulty = "orta";
        if (difficulty === "kolay" || difficulty === "easy") {
          finalDifficulty = "kolay";
        } else if (difficulty === "zor" || difficulty === "hard") {
          finalDifficulty = "zor";
        }

        try {
          let requestBody: Record<string, any> | null = null;

          // Doğru-yanlış soruları için resimdeki modele göre sadece text ve correct gönder
          if (denemeType === "dogruyanlis") {
            if (!rawAnswer) {
              errorCount++;
              continue;
            }

            let finalAnswer = "Doğru";
            if (lowerAnswer === "yanlış" || lowerAnswer === "yanlis") {
              finalAnswer = "Yanlış";
            } else if (lowerAnswer !== "doğru" && lowerAnswer !== "dogru") {
              errorCount++;
              continue;
            }

            requestBody = {
              text: questionText,
              correct: finalAnswer,
            };
          } else if (denemeType === "boslukdoldurma") {
            const optionsFromRow = extractBoslukOptions(normalized);
            if (optionsFromRow.length < 2) {
              errorCount++;
              continue;
            }

            if (!rawAnswer) {
              errorCount++;
              continue;
            }

            const hasAnswerInOptions = optionsFromRow.some(
              (option) => option.trim().toLowerCase() === lowerAnswer
            );
            const allOptions = hasAnswerInOptions
              ? optionsFromRow
              : [...optionsFromRow, rawAnswer];

            // Options'ları prefix'li yap
            const finalOptions = allOptions.map((opt, index) => {
              const prefix = String.fromCharCode(65 + index) + ") ";
              const cleanOpt = opt.replace(/^[A-E]\)\s*/, "");
              return prefix + cleanOpt;
            });

            // CorrectAnswer'ı da prefix'li yap
            const correctAnswerIndex = allOptions.findIndex(
              (opt) => opt.trim().toLowerCase() === lowerAnswer
            );
            const correctAnswerPrefix = correctAnswerIndex >= 0 
              ? String.fromCharCode(65 + correctAnswerIndex) + ") "
              : "A) ";
            const cleanCorrectAnswer = rawAnswer.replace(/^[A-E]\)\s*/, "");
            const correctAnswerWithPrefix = correctAnswerPrefix + cleanCorrectAnswer;

            requestBody = {
              questionText,
              correctAnswer: correctAnswerWithPrefix,
              options: finalOptions,
              explanation: explanation || "",
              difficulty: finalDifficulty,
              subject,
            };
          } else {
            // Mevzuat, Coğrafya, Tarih, Genel için options'ları prefix'li yap
            // Excel'den gelen seçenekleri al (eğer varsa)
            const excelOptions = extractBoslukOptions(normalized);
            const finalOptions = excelOptions.length > 0 
              ? excelOptions.map((opt, index) => {
                  const prefix = String.fromCharCode(65 + index) + ") ";
                  const cleanOpt = opt.replace(/^[A-E]\)\s*/, "");
                  return prefix + cleanOpt;
                })
              : ["A) Doğru", "B) Yanlış"];

            // CorrectAnswer'ı da prefix'li yap
            const correctAnswerPrefix = "A) ";
            const cleanCorrectAnswer = rawAnswer.replace(/^[A-E]\)\s*/, "");
            const correctAnswerWithPrefix = correctAnswerPrefix + cleanCorrectAnswer;

            requestBody = {
              questionText,
              correctAnswer: correctAnswerWithPrefix,
              options: finalOptions,
              explanation: explanation || "",
              difficulty: finalDifficulty,
              subject,
            };
          }

          const response = await fetch(
            `${config.adminApiPath}/${denemeId}/sorular?collection=${encodeURIComponent(collectionName)}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ ...requestBody, collection: collectionName }),
            }
          );

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error("Soru eklenirken hata:", err);
          errorCount++;
        }
      }

      toast.dismiss(loadingToastId); // Yükleniyor toast'unu kapat

      if (successCount > 0) {
        toast.success(`${successCount} soru başarıyla eklendi`);
        await fetchSorular(); // Listeyi yenile
      }
      if (errorCount > 0) {
        toast.warn(`${errorCount} soru eklenemedi`);
      }
      if (successCount === 0 && errorCount === 0) {
        toast.warn("Excel dosyasında geçerli soru bulunamadı");
      }

      setShowExcelModal(false);
    } catch (err) {
      console.error("Excel içe aktarım hatası:", err);
      toast.dismiss(loadingToastId); // Yükleniyor toast'unu kapat
      toast.error("Excel dosyası okunamadı");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AdminGuard>
      <Head>
        <title>
          {denemeData?.denemeName || "Deneme"} - {config.title} - Admin Panel
        </title>
        <meta
          name="description"
          content={`${
            denemeData?.denemeName || "Deneme"
          } ${config.title.toLowerCase()} yönetimi`}
        />
      </Head>

      <Header variant="admin" />

      <main className="container my-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 mb-4">
              <div className="w-100">
                <h1 className="h2">
                  <i className="bi bi-list-ul me-2"></i>
                  {denemeData?.denemeName || "Deneme"} - {config.title}
                  {collectionName !== "sorular" && (
                    <span className="badge bg-primary ms-2 fs-6">
                      <i className="bi bi-folder2-open me-1"></i>
                      {collectionName}
                    </span>
                  )}
                </h1>
                {denemeData && (
                  <p className="text-muted mb-0">
                    {collectionName !== "sorular" && (
                      <span className="me-2">
                        <strong>Koleksiyon:</strong> {collectionName} •
                      </span>
                    )}
                    {denemeData.totalCount} soru • Admin Panel
                  </p>
                )}
              </div>
              <div className="d-flex flex-wrap gap-2 w-100 w-lg-auto">
                <button
                  className="btn btn-outline-secondary flex-fill flex-lg-grow-0"
                  onClick={() => router.back()}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Geri Dön
                </button>
                {/* <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    router.push(`${config.userViewPath}/${denemeId}`);
                  }}
                >
                  <i className="bi bi-eye me-2"></i>
                  Kullanıcı Görünümü
                </button> */}
                <button
                  className="btn btn-outline-info flex-fill flex-lg-grow-0"
                  onClick={() => setShowExcelModal(true)}
                  disabled={importing}
                >
                  <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                  Excel'den Toplu Ekle
                </button>
                <button
                  className="btn btn-outline-success flex-fill flex-lg-grow-0"
                  onClick={handleExcelExport}
                  disabled={!denemeData}
                >
                  <i className="bi bi-file-earmark-arrow-down me-2"></i>
                  Excel'e Aktar
                </button>
                <button
                  className="btn btn-primary flex-fill flex-lg-grow-0"
                  onClick={handleAddSoru}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Yeni Soru Ekle
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <LoadingSpinner />
                <p className="mt-3 text-muted">Sorular yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button
                  className="btn btn-outline-danger btn-sm ms-3"
                  onClick={fetchSorular}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Tekrar Dene
                </button>
              </div>
            ) : !denemeData || denemeData.sorular.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-question-circle display-1 text-muted"></i>
                <h3 className="mt-3 text-muted">Henüz soru bulunmuyor</h3>
                <p className="text-muted">
                  Bu denemede henüz hiç soru eklenmemiş.
                </p>
                <button
                  className="btn btn-primary mt-3"
                  onClick={handleAddSoru}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  İlk Soruyu Ekle
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Soru</th>
                      <th>Seçenekler</th>
                      <th>Doğru Cevap</th>
                      <th>Zorluk</th>
                      <th>Konu</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denemeData.sorular.map((soru, index) => (
                      <tr key={soru.id}>
                        <td>
                          <div>
                            <strong>Soru {index + 1}:</strong>
                            <br />
                            <small className="text-muted">
                              {soru.soru.length > 100
                                ? soru.soru.substring(0, 100) + "..."
                                : soru.soru}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            {soru.secenekler.map((secenek, secenekIndex) => (
                              <small
                                key={secenekIndex}
                                className={`p-1 rounded ${
                                  secenekIndex === soru.dogruSecenek
                                    ? "bg-success text-white"
                                    : "bg-light"
                                }`}
                              >
                                {String.fromCharCode(65 + secenekIndex)}.{" "}
                                {secenek.length > 30
                                  ? secenek.substring(0, 30) + "..."
                                  : secenek}
                              </small>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-success">
                            {String.fromCharCode(65 + soru.dogruSecenek)}
                          </span>
                          <br />
                          <small className="text-muted">
                            {soru.cevap.length > 30
                              ? soru.cevap.substring(0, 30) + "..."
                              : soru.cevap}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`badge ${getZorlukBadgeClass(
                              soru.zorluk
                            )}`}
                          >
                            {getZorlukText(soru.zorluk)}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">{soru.konu}</span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              title="Görüntüle"
                              onClick={() => handleViewSoru(soru)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-outline-warning btn-sm"
                              title="Düzenle"
                              onClick={() => handleEditSoru(soru)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Sil"
                              onClick={() => handleDeleteSoru(soru)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {denemeData && denemeData.sorular.length > 0 && (
              <div className="mt-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="card-title">
                          <i className="bi bi-info-circle me-2"></i>
                          İstatistikler
                        </h5>
                        <p className="card-text">
                          <strong>Toplam Soru:</strong> {denemeData.totalCount}
                          <br />
                          <strong>Zorluk Dağılımı:</strong>
                          <br />• Kolay:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "kolay"
                            ).length
                          }
                          <br />• Orta:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "orta"
                            ).length
                          }
                          <br />• Zor:{" "}
                          {
                            denemeData.sorular.filter(
                              (s) => s.zorluk.toLowerCase() === "zor"
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h5 className="card-title">
                          <i className="bi bi-gear me-2"></i>
                          Hızlı İşlemler
                        </h5>
                        <div className="d-grid gap-2">
                          <button className="btn btn-outline-primary btn-sm">
                            <i className="bi bi-download me-2"></i>
                            Soruları Dışa Aktar
                          </button>
                          <button className="btn btn-outline-secondary btn-sm">
                            <i className="bi bi-upload me-2"></i>
                            Soru İçe Aktar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Yeni Soru Ekleme Modal */}
      <CustomModal
        isOpen={isAddModalOpen}
        onClose={closeModals}
        title="Yeni Soru Ekle"
        size="lg"
      >
        <div className="p-3">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Soru Metni */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Soru Metni: <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={newSoruForm.soru}
                onChange={(e) =>
                  setNewSoruForm({ ...newSoruForm, soru: e.target.value })
                }
                placeholder="Soruyu buraya yazın..."
                required
              />
            </div>

            {/* Doğru-Yanlış için özel seçenekler */}
            {denemeType === "dogruyanlis" ? (
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Doğru Cevap: <span className="text-danger">*</span>
                </label>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Sorunun doğru cevabını seçin.
                </div>
                <div className="d-flex gap-3">
                  <div className="form-check form-check-lg">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="dogruSecenek"
                      id="dogruSecenek0"
                      checked={newSoruForm.dogruSecenek === 0}
                      onChange={() =>
                        setNewSoruForm({ ...newSoruForm, dogruSecenek: 0 })
                      }
                    />
                    <label className="form-check-label" htmlFor="dogruSecenek0">
                      <strong>Doğru</strong>
                    </label>
                  </div>
                  <div className="form-check form-check-lg">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="dogruSecenek"
                      id="dogruSecenek1"
                      checked={newSoruForm.dogruSecenek === 1}
                      onChange={() =>
                        setNewSoruForm({ ...newSoruForm, dogruSecenek: 1 })
                      }
                    />
                    <label className="form-check-label" htmlFor="dogruSecenek1">
                      <strong>Yanlış</strong>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Seçenekler */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Seçenekler: <span className="text-danger">*</span>
                  </label>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    En az 2 seçenek doldurulmalıdır. Doğru cevabı işaretleyin.
                  </div>
                  {newSoruForm.secenekler.map((secenek, index) => (
                    <div key={index} className="input-group mb-2">
                      <span className="input-group-text">
                        <input
                          type="radio"
                          name="dogruSecenek"
                          checked={newSoruForm.dogruSecenek === index}
                          onChange={() =>
                            setNewSoruForm({
                              ...newSoruForm,
                              dogruSecenek: index,
                            })
                          }
                          className="form-check-input me-2"
                        />
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={secenek}
                        onChange={(e) => {
                          const newSecenekler = [...newSoruForm.secenekler];
                          newSecenekler[index] = e.target.value;
                          setNewSoruForm({
                            ...newSoruForm,
                            secenekler: newSecenekler,
                          });
                        }}
                        placeholder={`${String.fromCharCode(
                          65 + index
                        )} seçeneği...`}
                      />
                    </div>
                  ))}
                </div>

                {/* Cevap Açıklaması */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Cevap Açıklaması: <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={newSoruForm.cevap}
                    onChange={(e) =>
                      setNewSoruForm({ ...newSoruForm, cevap: e.target.value })
                    }
                    placeholder="Doğru cevabın açıklamasını yazın..."
                    required
                  />
                </div>
              </>
            )}

            {/* Zorluk ve Konu */}
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Zorluk:</label>
                  <select
                    className="form-select"
                    value={newSoruForm.zorluk}
                    onChange={(e) =>
                      setNewSoruForm({ ...newSoruForm, zorluk: e.target.value })
                    }
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Konu: <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={newSoruForm.konu}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                  <div className="form-text">
                    <i className="bi bi-info-circle me-1"></i>
                    Konu deneme türüne göre otomatik belirlenir.
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama - Doğru-yanlış için opsiyonel */}
            {denemeType !== "dogruyanlis" && (
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Açıklama (Opsiyonel):
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={newSoruForm.aciklama}
                  onChange={(e) =>
                    setNewSoruForm({ ...newSoruForm, aciklama: e.target.value })
                  }
                  placeholder="Soru hakkında ek bilgi varsa yazın..."
                />
              </div>
            )}

            {/* Butonlar */}
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModals}
              >
                <i className="bi bi-x-circle me-1"></i>
                İptal
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={addNewSoru}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-1"></i>
                {loading ? "Ekleniyor..." : "Soru Ekle"}
              </button>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* Soru Görüntüleme Modal */}
      <CustomModal
        isOpen={isViewModalOpen}
        onClose={closeModals}
        title="Soru Detayları"
        size="lg"
      >
        {selectedSoru && (
          <div className="p-3">
            <div className="mb-3">
              <h6 className="fw-bold">Soru:</h6>
              <p className="border p-3 rounded bg-light  text-dark">
                {selectedSoru.soru}
              </p>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold">Seçenekler:</h6>
              {selectedSoru.secenekler.map((secenek, index) => (
                <div
                  key={index}
                  className={`p-2 mb-2 rounded text-dark ${
                    index === selectedSoru.dogruSecenek
                      ? "bg-success text-white"
                      : "bg-light"
                  }`}
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong> {secenek}
                </div>
              ))}
            </div>

            <div className="mb-3">
              <h6 className="fw-bold">Doğru Cevap:</h6>
              <span className="badge bg-success fs-6">
                {String.fromCharCode(65 + selectedSoru.dogruSecenek)}
              </span>
              <p className="mt-2 text-dark">{selectedSoru.cevap}</p>
            </div>

            <div className="row">
              <div className="col-md-6">
                <h6 className="fw-bold">Zorluk:</h6>
                <span
                  className={`badge ${getZorlukBadgeClass(
                    selectedSoru.zorluk
                  )}`}
                >
                  {getZorlukText(selectedSoru.zorluk)}
                </span>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold">Konu:</h6>
                <span className="badge bg-info">{selectedSoru.konu}</span>
              </div>
            </div>

            {selectedSoru.aciklama && (
              <div className="mt-3">
                <h6 className="fw-bold">Açıklama:</h6>
                <p className="border p-3 rounded bg-light">
                  {selectedSoru.aciklama}
                </p>
              </div>
            )}
          </div>
        )}
      </CustomModal>

      {/* Soru Düzenleme Modal */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        title="Soru Düzenle"
        size="lg"
      >
        <div className="p-3">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Soru Metni */}
            <div className="mb-3">
              <label className="form-label fw-bold">Soru Metni:</label>
              <textarea
                className="form-control"
                rows={4}
                value={editForm.soru}
                onChange={(e) =>
                  setEditForm({ ...editForm, soru: e.target.value })
                }
                required
              />
            </div>

            {/* Doğru-Yanlış için özel seçenekler */}
            {denemeType === "dogruyanlis" ? (
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Doğru Cevap: <span className="text-danger">*</span>
                </label>
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Sorunun doğru cevabını seçin.
                </div>
                <div className="d-flex gap-3">
                  <div className="form-check form-check-lg">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="dogruSecenekEdit"
                      id="dogruSecenekEdit0"
                      checked={editForm.dogruSecenek === 0}
                      onChange={() =>
                        setEditForm({ ...editForm, dogruSecenek: 0 })
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="dogruSecenekEdit0"
                    >
                      <strong>Doğru</strong>
                    </label>
                  </div>
                  <div className="form-check form-check-lg">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="dogruSecenekEdit"
                      id="dogruSecenekEdit1"
                      checked={editForm.dogruSecenek === 1}
                      onChange={() =>
                        setEditForm({ ...editForm, dogruSecenek: 1 })
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor="dogruSecenekEdit1"
                    >
                      <strong>Yanlış</strong>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Seçenekler */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Seçenekler:</label>
                  {editForm.secenekler.map((secenek, index) => (
                    <div key={index} className="input-group mb-2">
                      <span className="input-group-text">
                        <input
                          type="radio"
                          name="dogruSecenek"
                          checked={editForm.dogruSecenek === index}
                          onChange={() =>
                            setEditForm({ ...editForm, dogruSecenek: index })
                          }
                          className="form-check-input me-2"
                        />
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={secenek}
                        onChange={(e) => {
                          const newSecenekler = [...editForm.secenekler];
                          newSecenekler[index] = e.target.value;
                          setEditForm({
                            ...editForm,
                            secenekler: newSecenekler,
                          });
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>

                {/* Cevap Açıklaması */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Cevap Açıklaması:
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editForm.cevap}
                    onChange={(e) =>
                      setEditForm({ ...editForm, cevap: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            )}

            {/* Zorluk ve Konu */}
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Zorluk:</label>
                  <select
                    className="form-select"
                    value={editForm.zorluk}
                    onChange={(e) =>
                      setEditForm({ ...editForm, zorluk: e.target.value })
                    }
                  >
                    <option value="kolay">Kolay</option>
                    <option value="orta">Orta</option>
                    <option value="zor">Zor</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold">Konu:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.konu}
                    readOnly
                    style={{ backgroundColor: "#f8f9fa" }}
                  />
                  <div className="form-text">
                    <i className="bi bi-info-circle me-1"></i>
                    Konu deneme türüne göre otomatik belirlenir.
                  </div>
                </div>
              </div>
            </div>

            {/* Açıklama */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                Açıklama (Opsiyonel):
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={editForm.aciklama}
                onChange={(e) =>
                  setEditForm({ ...editForm, aciklama: e.target.value })
                }
              />
            </div>

            {/* Butonlar */}
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModals}
              >
                <i className="bi bi-x-circle me-1"></i>
                İptal
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={updateSoru}
                disabled={loading}
              >
                <i className="bi bi-check-circle me-1"></i>
                {loading ? "Güncelleniyor..." : "Güncelle"}
              </button>
            </div>
          </form>
        </div>
      </CustomModal>

      {/* Soru Silme Onay Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={deleteSoru}
        title="Soru Sil"
        message={`"${selectedSoru?.soru.substring(
          0,
          50
        )}..." sorusunu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`}
        confirmText="Sil"
        cancelText="İptal"
        confirmVariant="danger"
        icon="bi-trash"
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onFileSelect={handleExcelImport}
        title={excelModalConfig.title}
        description={excelModalConfig.description}
        columns={excelModalConfig.columns}
        exampleData={excelModalConfig.exampleData}
        accept={excelModalConfig.accept}
        buttonText={excelModalConfig.buttonText}
        buttonIcon={excelModalConfig.buttonIcon}
      />
    </AdminGuard>
  );
}
