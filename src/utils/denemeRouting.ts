export interface DenemeRouteConfig {
  // Client tarafında kullanılan path'ler
  userViewPath: string;
  adminSorularPath: string;

  // API endpoint'leri
  apiPath: string;
  adminApiPath: string;

  // UI gösterimi
  defaultKonu: string;
  title: string;
  displayName: string;
}

export const DENEME_ROUTE_CONFIGS: Record<string, DenemeRouteConfig> = {
  mevzuat: {
    userViewPath: "/denemeler",
    adminSorularPath: "/admin/denemeler",
    apiPath: "/api/denemeler",
    adminApiPath: "/api/admin/denemeler",
    defaultKonu: "Güncel Bilgiler",
    title: "Deneme Soruları",
    displayName: "Mevzuat Denemeleri",
  },
  genel: {
    userViewPath: "/genel-denemeler",
    adminSorularPath: "/admin/genel-denemeler",
    apiPath: "/api/genel-denemeler",
    adminApiPath: "/api/admin/genel-denemeler",
    defaultKonu: "Güncel Bilgiler",
    title: "Güncel Bilgiler Soruları",
    displayName: "Güncel Bilgiler Denemeleri",
  },
  cografya: {
    userViewPath: "/cografya-denemeler",
    adminSorularPath: "/admin/cografya-denemeler",
    apiPath: "/api/cografya-denemeler",
    adminApiPath: "/api/admin/cografya-denemeler",
    defaultKonu: "Coğrafya",
    title: "Coğrafya Denemesi Soruları",
    displayName: "Coğrafya Denemeleri",
  },
  tarih: {
    userViewPath: "/tarih-denemeler",
    adminSorularPath: "/admin/tarih-denemeler",
    apiPath: "/api/tarih-denemeler",
    adminApiPath: "/api/admin/tarih-denemeler",
    defaultKonu: "Tarih",
    title: "Tarih Denemesi Soruları",
    displayName: "Tarih Denemeleri",
  },
  dogruyanlis: {
    userViewPath: "/dogru-yanlis",
    adminSorularPath: "/admin/dogru-yanlis",
    apiPath: "/api/dogru-yanlis",
    adminApiPath: "/api/admin/dogru-yanlis",
    defaultKonu: "Doğru-Yanlış",
    title: "Doğru-Yanlış Soruları",
    displayName: "Doğru-Yanlış Denemeleri",
  },
  boslukdoldurma: {
    userViewPath: "/bosluk-doldurma",
    adminSorularPath: "/admin/bosluk-doldurma",
    apiPath: "/api/bosluk-doldurma",
    adminApiPath: "/api/admin/bosluk-doldurma",
    defaultKonu: "Boşluk Doldurma",
    title: "Boşluk Doldurma Soruları",
    displayName: "Boşluk Doldurma Denemeleri",
  },
};

// Helper fonksiyonlar
export function getDenemeConfig(denemeType: string): DenemeRouteConfig {
  return DENEME_ROUTE_CONFIGS[denemeType] || DENEME_ROUTE_CONFIGS.mevzuat;
}

export function getUserViewPath(denemeType: string): string {
  return getDenemeConfig(denemeType).userViewPath;
}

export function getAdminSorularPath(denemeType: string): string {
  return getDenemeConfig(denemeType).adminSorularPath;
}

export function getApiPath(denemeType: string): string {
  return getDenemeConfig(denemeType).apiPath;
}

export function getAdminApiPath(denemeType: string): string {
  return getDenemeConfig(denemeType).adminApiPath;
}
