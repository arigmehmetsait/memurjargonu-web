// Ortak deneme tipleri
export interface Deneme {
  id: string;
  name: string;
  soruSayisi: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

export interface Soru {
  id: string;
  soru: string;
  cevap: string;
  secenekler: string[];
  dogruSecenek: number;
  aciklama?: string;
  zorluk?: string;
  konu?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: string;
}

export interface DenemeData {
  denemeId: string;
  denemeName: string;
  sorular: Soru[];
  totalCount: number;
}

// Deneme türleri
export type DenemeType =
  | "mevzuat"
  | "cografya"
  | "tarih"
  | "genel"
  | "dogruyanlis";

// API yanıt tipleri
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  message?: string;
}

// Deneme koleksiyon isimleri
export const DENEME_COLLECTIONS = {
  mevzuat: "MevzuatDeneme",
  cografya: "RealCografyaDenemeler",
  tarih: "tarihdenemeler",
  genel: "denemeler",
  dogruyanlis: "dogruyanlis",
} as const;

// API endpoint'leri
export const DENEME_API_ENDPOINTS = {
  mevzuat: {
    list: "/api/denemeler/list",
    sorular: (denemeId: string) => `/api/denemeler/${denemeId}/sorular`,
    admin: {
      create: "/api/admin/denemeler/create",
      delete: (denemeId: string) =>
        `/api/admin/denemeler/delete?denemeId=${denemeId}`,
    },
  },
  cografya: {
    list: "/api/cografya-denemeler/list",
    sorular: (denemeId: string) =>
      `/api/cografya-denemeler/${denemeId}/sorular`,
    admin: {
      create: "/api/admin/cografya-denemeler/create",
      delete: (denemeId: string) =>
        `/api/admin/cografya-denemeler/delete?denemeId=${denemeId}`,
    },
  },
  tarih: {
    list: "/api/tarih-denemeler/list",
    sorular: (denemeId: string) => `/api/tarih-denemeler/${denemeId}/sorular`,
    admin: {
      create: "/api/admin/tarih-denemeler/create",
      delete: (denemeId: string) =>
        `/api/admin/tarih-denemeler/delete?denemeId=${denemeId}`,
    },
  },
  genel: {
    list: "/api/genel-denemeler/list",
    sorular: (denemeId: string) => `/api/genel-denemeler/${denemeId}/sorular`,
    admin: {
      create: "/api/admin/genel-denemeler/create",
      delete: (denemeId: string) =>
        `/api/admin/genel-denemeler/delete?denemeId=${denemeId}`,
    },
  },
  dogruyanlis: {
    list: "/api/dogru-yanlis/list",
    sorular: (denemeId: string) => `/api/dogru-yanlis/${denemeId}/sorular`,
    admin: {
      create: "/api/admin/dogru-yanlis/create",
      delete: (denemeId: string) =>
        `/api/admin/dogru-yanlis/delete?denemeId=${denemeId}`,
    },
  },
} as const;
