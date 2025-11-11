// File: app/courses/[id]/page.js
// Halaman Detail Kursus (Integrasi 3 Service)

"use client";

// 1. Import semua "bahan"
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation"; // Import 'useParams'
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle,
  PlayCircle,
  Users,
  Clock,
  CalendarDays,
  Shield,
  Loader2,
  AlertCircle,
  User,
  FileText,
  ExternalLink,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function CourseDetailPage() {
  const { user, loading: authLoading, apiFetch } = useAuth();
  const router = useRouter();
  const params = useParams(); // Hook untuk ambil 'id' dari URL
  const { id } = params; // Ini adalah ID kursus, cth: "5"

  // 2. Siapkan "Memori" (State)
  const [course, setCourse] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    isEnrolled: false,
    grade: null,
  });
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. "OTAK" EAI: useEffect Paling Canggih
  useEffect(() => {
    if (user && id) {
      // Hanya jalan jika user ADA dan ID kursus ADA
      const fetchAllCourseData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // --- PANGGILAN API #1 (Ke Course Service) ---
          // Ambil data utama: Judul, Deskripsi, Pengajar, Materi, Jadwal
          const courseRes = await apiFetch(`/api/courses/${id}`);
          if (courseRes.status !== "success") {
            throw new Error(courseRes.message || "Course tidak ditemukan");
          }
          const courseData = courseRes.data;

          // --- PANGGILAN API #2 (Ke Enrollment Service) ---
          // (Idemu!) Ambil jumlah total 'students'
          let studentCount = 0;
          try {
            const enrollCountRes = await apiFetch(
              `/api/enrollments?course_id=${id}`
            );
            if (enrollCountRes.status === "success") {
              studentCount = enrollCountRes.count;
            }
          } catch (e) {
            /* Biarkan 0 jika error */
          }

          // --- PANGGILAN API #3 (Ke Enrollment Service) ---
          // Cek status ENROLLMENT untuk user yang login
          const myEnrollmentsRes = await apiFetch("/api/enrollments");
          const myEnrollments = myEnrollmentsRes.data || [];
          const myEnrollment = myEnrollments.find((e) => e.course_id == id);
          const isEnrolled = !!myEnrollment; // true atau false

          // --- PANGGILAN API #4 (Ke Grade Service) ---
          // HANYA JALAN JIKA SUDAH ENROLL
          let myGrade = null;
          if (isEnrolled) {
            try {
              const gradeRes = await apiFetch(`/api/grades?course_id=${id}`);
              if (gradeRes.status === "success" && gradeRes.data.length > 0) {
                myGrade = gradeRes.data[0].grade; // Cth: "A-"
              }
            } catch (e) {
              /* Biarkan null jika error */
            }
          }

          // 4. Simpan semua hasil ke "Memori" (State)
          setCourse(courseData);
          setStudentCount(studentCount);
          setEnrollmentStatus({ isEnrolled: isEnrolled, grade: myGrade });
        } catch (err) {
          setError(err.message);
          toast.error(`Gagal memuat data: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAllCourseData();
    }
  }, [user, id, apiFetch]); // Jalankan ulang jika user atau ID berubah

  // 5. Fungsi "Enroll Now" (BARU)
  const handleEnroll = async () => {
    const loadingToast = toast.loading("Mendaftarkan ke kursus...");
    try {
      // (Kita 'hardcode' student_id = user.id, karena "Satpam" kita sudah "pintar")
      const res = await apiFetch("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({
          student_id: user.id,
          course_id: course.id,
        }),
      });

      if (res.status !== "success") {
        throw new Error(res.message || "Gagal mendaftar");
      }

      toast.success("Berhasil terdaftar!", { id: loadingToast });

      // Refresh data di halaman
      setEnrollmentStatus({ isEnrolled: true, grade: null });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  // 6. Tampilan "Loading"
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
        />
      </div>
    );
  }

  // 7. Tampilan "Error"
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // 8. Tampilan "Sukses" (Data sudah ada)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster />

      {/* (Kita bisa pakai 'Top Navigation' yang sama, tapi 'Back' lebih simpel) */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Kembali ke Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Konten Halaman */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri (Detail) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Judul & Deskripsi */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg"
            >
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                {course.category}
              </span>
              <h1 className="text-4xl font-bold text-gray-800 mt-4 mb-3">
                {course.title}
              </h1>
              <div className="flex items-center gap-2 text-md text-gray-600 mb-4">
                <User className="w-5 h-5" />
                <span>
                  Diajar oleh <strong>{course.instructor}</strong>
                </span>
              </div>
              <p className="text-gray-600 text-base leading-relaxed">
                {course.description || "Tidak ada deskripsi."}
              </p>
            </motion.div>

            {/* Materi & Jadwal (TODO: Bikin Tab) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Materi Kursus
              </h2>
              <ul className="space-y-3">
                {course.materials.map((material) => (
                  <a
                    key={material.id}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:shadow-md transition-all group cursor-pointer"
                  >
                    {material.type.toLowerCase() === "video" ? (
                      <PlayCircle className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-green-500" />
                    )}
                    <span className="text-gray-700 font-medium group-hover:text-indigo-600">
                      {material.title}
                    </span>
                    <span className="ml-auto text-xs font-semibold text-gray-500 uppercase">
                      {material.type}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
                {course.materials.length === 0 && (
                  <p className="text-gray-500">
                    Belum ada materi untuk kursus ini.
                  </p>
                )}
              </ul>
            </motion.div>
          </div>

          {/* Kolom Kanan (Status) */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-200 shadow-lg sticky top-24"
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover"
              />

              <div className="p-6">
                {/* 1. Tampilkan Tombol ENROLL (Jika BELUM) */}
                {!enrollmentStatus.isEnrolled && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnroll}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    Daftar ke Kursus Ini
                  </motion.button>
                )}

                {/* 2. Tampilkan "SUDAH TERDAFTAR" (Jika SUDAH) */}
                {enrollmentStatus.isEnrolled && (
                  <div className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Kamu Sudah Terdaftar
                  </div>
                )}

                {/* Detail Statistik */}
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Peserta
                    </span>
                    <span className="font-semibold text-gray-800">
                      {studentCount} Students
                    </span>
                  </div>

                  {course.schedule && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" /> Jadwal
                      </span>
                      <span className="font-semibold text-gray-800">
                        {course.schedule.day},{" "}
                        {course.schedule.time.substring(0, 5)}
                      </span>
                    </div>
                  )}

                  {/* 3. Tampilkan NILAI (Jika SUDAH ENROLL) */}
                  {enrollmentStatus.isEnrolled && (
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Nilai Kamu
                      </span>
                      <span className="font-semibold text-indigo-600 text-lg">
                        {enrollmentStatus.grade || "Belum Dinilai"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
