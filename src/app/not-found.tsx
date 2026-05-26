import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-indigo-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trang không tồn tại</h1>
        <p className="text-gray-500 mb-8">Trang bạn đang tìm không có hoặc đã bị xóa.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          ← Về Dashboard
        </Link>
      </div>
    </main>
  );
}
