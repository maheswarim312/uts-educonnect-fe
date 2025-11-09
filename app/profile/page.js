"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  
  // Ambil data user & token dari "brankas"
  const { user, token, logout } = useAuth();
  const router = useRouter();

  // Kalau belum login dan coba akses /profile, alihkan ke halaman login
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-3xl font-bold">Loading...</h1>
        <p>Mengarahkan ke Halaman Login...</p>
      </main>
    );
  }

  // Kalau sudah login
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      
      <h1 className="text-4xl font-bold mb-4">
        Selamat Datang, <span className="text-blue-500">{user.name}!</span>
      </h1>
      
      <p className="text-xl mb-6">Role kamu adalah: {user.role}</p>
      
      <button 
        onClick={logout} 
        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
      >
        Logout
      </button>

      <details className="mt-8 bg-gray-900 p-4 rounded w-full max-w-lg">
        <summary>Lihat Token-mu (Info Teknis)</summary>
        <p className="text-sm break-all mt-2">{token}</p>
      </details>

    </main>
  );
}