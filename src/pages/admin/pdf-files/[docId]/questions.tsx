"use client";

import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import AdminGuard from "@/components/AdminGuard";
import QuestionsManagement from "@/components/admin/QuestionsManagement";

export default function PDFQuestionsPage() {
  const router = useRouter();
  const { docId } = router.query;

  if (!docId) {
    return (
      <AdminGuard>
        <Head>
          <title>Sorular - Admin Panel</title>
        </Head>
        <Header variant="admin" />
        <main className="container py-5">
          <div className="alert alert-danger">PDF ID bulunamadı</div>
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
          pdfId={docId as string}
          apiBasePath="/api/admin/pdf-files"
          apiTitlePath="/api/admin/pdf-files"
          onBack={() => router.back()}
        />
      </main>
    </AdminGuard>
  );
}
