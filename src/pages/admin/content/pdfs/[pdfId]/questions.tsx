"use client";

import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import QuestionsManagement from "@/components/admin/QuestionsManagement";
import { PDFSubcategory } from "@/types/pdf";

export default function PDFQuestionsPage() {
  const router = useRouter();
  const { pdfId, subcategory } = router.query;

  const getApiBasePath = () => {
    if (subcategory === PDFSubcategory.TARIH) {
      return "/api/admin/pdf-files";
    }
    return "/api/admin/content/pdfs";
  };

  const getApiTitlePath = () => {
    if (subcategory === PDFSubcategory.TARIH) {
      return "/api/admin/pdf-files";
    }
    return `/api/admin/content/pdfs?subcategory=${subcategory}`;
  };

  if (!pdfId || !subcategory) {
    return (
      <AdminGuard>
        <Head>
          <title>Sorular - Admin Panel</title>
        </Head>
        <Header variant="admin" />
        <main className="container py-5">
          <div className="alert alert-danger">
            PDF ID veya kategori bulunamadı
          </div>
        </main>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <Head>
        <title>Sorular - Admin Panel</title>
      </Head>
      <Header variant="admin" />
      <main className="container-fluid py-4">
        <QuestionsManagement
          pdfId={pdfId as string}
          apiBasePath={getApiBasePath()}
          apiTitlePath={
            subcategory === PDFSubcategory.TARIH
              ? "/api/admin/pdf-files"
              : `/api/admin/content/pdfs/${pdfId}?subcategory=${subcategory}`
          }
          subcategory={
            subcategory === PDFSubcategory.TARIH ? undefined : (subcategory as string)
          }
          onBack={() => router.back()}
        />
      </main>
    </AdminGuard>
  );
}

