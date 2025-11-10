// File: app/profile/page.js
// VERSI LENGKAP (Sudah ada form dinamis + API logic)

"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // (1) Import useState
import Link from "next/link";
import { ArrowLeft, User, Shield, BookOpen, Briefcase } from "lucide-react"; // (2) Import ikon baru
import toast, { Toaster } from "react-hot-toast"; // (3) Import Toaster
import { motion } from "framer-motion";

export default function ProfilePage() {
  // (4) Ambil apiFetch dari brankas
  const { user, loading, logout, apiFetch } = useAuth();
  const router = useRouter();

  // (5) State baru untuk form dan data profil
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);

  // (6) "Satpam" (Sudah benar)
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // (7) "Pengambil Data Profil" (useEffect BARU)
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const fetchProfile = async () => {
        try {
          setProfileLoading(true);
          const data = await apiFetch("/api/profile/me");
          setProfileData(data.data);
          setFormData(data.data || {}); 
        } catch (err) {
          if (err.message.includes("Profil belum diisi")) {
            setProfileData(null);
            setFormData({});
          } else {
            toast.error(`Gagal ambil profil: ${err.message}`);
          }
        } finally {
          setProfileLoading(false);
        }
      };
      fetchProfile();
    } else if (user) {
       setProfileLoading(false);
    }
  }, [user, apiFetch]);

  // (8) Fungsi "Update Profil" (BARU)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Menyimpan profil...");
    try {
      const data = await apiFetch("/api/profile/me", {
        method: "PUT",
        body: JSON.stringify(formData)
      });
      setProfileData(data.data);
      toast.success("Profil berhasil disimpan!", { id: loadingToast });
    } catch (err) {
      toast.error(`Gagal simpan: ${err.message}`, { id: loadingToast });
    }
  };

  // (9) Fungsi "Form Change" (BARU)
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // (10) Tampilan Loading (Versi PINTAR)
  if (loading || profileLoading || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        {/* (Bisa pakai loading spinner-mu yang keren) */}
        <h1 className="text-3xl font-bold text-gray-700">Loading Data...</h1>
      </main>
    );
  }

  // (11) Tampilan UTAMA (Versi BARU dengan form dinamis)
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 md:p-12">
      <Toaster />
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* --- Header Profil (dari kodemu) --- */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-lg p-6 md:p-8 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {user.name}
                </h1>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full text-xs font-semibold ${
                user.role === "admin"
                  ? "bg-green-100 text-green-700"
                  : user.role === "pengajar"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {user.role === "admin" ? <Shield className="w-3 h-3" /> : (user.role === 'pengajar' ? <Briefcase className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />)}
              {user.role}
            </span>
          </div>
        </div>

        {/* ▼▼▼ FORM EDIT PROFIL (BAGIAN BARU) ▼▼▼ */}
        {user.role !== 'admin' ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {profileData ? 'Update Profil Kamu' : 'Lengkapi Profil Kamu'}
            </h2>

            <form onSubmit={handleProfileUpdate}>
              
              {/* --- FORM DINAMIS UNTUK MURID --- */}
              {user.role === 'murid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">NIM</label>
                    <input 
                      type="text" name="nim" value={formData.nim || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800"
                      placeholder="Contoh: 123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jurusan</label>
                    <input 
                      type="text" name="jurusan" value={formData.jurusan || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800"
                      placeholder="Contoh: Teknik Informatika"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Angkatan</label>
                    <input 
                      type="number" name="angkatan" value={formData.angkatan || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800"
                      placeholder="Contoh: 2023"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Alamat</label>
                    <input 
                      type="text" name="alamat" value={formData.alamat || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800"
                      placeholder="Contoh: Jl. Edukasi No. 1"
                    />
                  </div>
                </div>
              )}

              {/* --- FORM DINAMIS UNTUK PENGAJAR --- */}
              {user.role === 'pengajar' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">NIP</label>
                    <input 
                      type="text" name="nip" value={formData.nip || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800"
                      placeholder="Contoh: 987654"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bidang Keahlian</label>
                    <input 
                      type="text" name="bidang" value={formData.bidang || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800"
                      placeholder="Contoh: Rekayasa Perangkat Lunak"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Alamat</label>
                    <input 
                      type="text" name="alamat" value={formData.alamat || ''}
                      onChange={handleFormChange}
                      className="mt-1 block w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800"
                      placeholder="Contoh: Jl. Edukasi No. 1"
                    />
                  </div>
                </div>
              )}
              
              {/* Tombol Simpan */}
              <div className="mt-6 text-right">
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Simpan Profil
                </motion.button>
              </div>

            </form>
          </div>
        ) : (
          // Ini untuk ADMIN
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-gray-200 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">
              Profil Admin
            </h2>
            <p className="text-gray-600 mt-4">
              Admin tidak memiliki profil data diri (NIM/NIP).
              Silakan kelola data user melalui <Link href="/admin/users" className="text-blue-600 font-semibold hover:underline">Admin Panel</Link>.
            </p>
          </div>
        )}
        {/* ▲▲▲ SELESAI FORM EDIT PROFIL ▲▲▲ */}

      </div>
    </main>
  );
}