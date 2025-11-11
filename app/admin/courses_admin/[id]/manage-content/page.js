
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  FileText,
  PlayCircle,
  ListOrdered,
  LogOut,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ManageCourseContentPage() {
  const { user, loading: authLoading, apiFetch, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id: courseId } = params;

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialType, setNewMaterialType] = useState("video");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");

  useEffect(() => {
    if (user && courseId) {
      const fetchCourse = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const res = await apiFetch(`/api/courses/${courseId}`);
          if (res.status !== "success") throw new Error(res.message);

          const courseData = res.data;
          setCourse(courseData);

          if (courseData.schedule) {
            setScheduleDay(courseData.schedule.day || "");
            setScheduleTime(courseData.schedule.time?.substring(0, 5) || "");
          }
        } catch (err) {
          setError(err.message);
          toast.error(`Gagal memuat data: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourse();
    }
  }, [user, courseId, apiFetch]);

  // Update Schedule
  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Menyimpan jadwal...");

    try {
      const res = await apiFetch(`/api/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify({
          schedule: {
            day: scheduleDay,
            time: scheduleTime ? `${scheduleTime}:00` : null,
          },
        }),
      });

      if (res.status !== "success") throw new Error(res.message);

      setCourse(res.data);
      toast.success("Jadwal berhasil diupdate!", { id: loadingToast });
    } catch (err) {
      toast.error(`Gagal update jadwal: ${err.message}`, { id: loadingToast });
    }
  };

  // Add Material
  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialTitle || !newMaterialUrl)
      return toast.error("Judul & URL wajib diisi!");

    const loadingToast = toast.loading("Menambah materi...");

    try {
      const res = await apiFetch(`/api/courses/${courseId}/materials`, {
        method: "POST",
        body: JSON.stringify({
          title: newMaterialTitle,
          type: newMaterialType,
          url: newMaterialUrl,
        }),
      });

      if (res.status !== "success") throw new Error(res.message);

      setCourse((prev) => ({
        ...prev,
        materials: [...prev.materials, res.data],
      }));

      setNewMaterialTitle("");
      setNewMaterialUrl("");

      toast.success("Materi berhasil ditambah!", { id: loadingToast });
    } catch (err) {
      toast.error(`Gagal menambah materi: ${err.message}`, {
        id: loadingToast,
      });
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (materialId, materialTitle) => {
    if (!confirm(`Hapus materi "${materialTitle}"?`)) return;

    const loadingToast = toast.loading("Menghapus materi...");
    try {
      const res = await apiFetch(`/api/materials/${materialId}`, {
        method: "DELETE",
      });

      if (res.status !== "success") throw new Error(res.message);

      setCourse((prev) => ({
        ...prev,
        materials: prev.materials.filter((m) => m.id !== materialId),
      }));

      toast.success("Materi berhasil dihapus", { id: loadingToast });
    } catch (err) {
      toast.error(`Gagal menghapus: ${err.message}`, { id: loadingToast });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
    toast.success("Logged out!");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Oops! Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/admin/courses_admin"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Kembali ke Course Management
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-10">
      <Toaster position="top-center" />

      <motion.nav className="bg-white/80 backdrop-blur-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link
            href="/admin/courses_admin"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 text-black">Manage: {course.title}</h1>
        <p className="text-indigo-600 font-semibold mb-6">
          Course ID: {course.id}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedule */}
          <div className="bg-white/80 p-6 rounded-2xl shadow border">
            <div className="flex items-center gap-3 mb-6">
              <CalendarDays className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-black">Manage Schedule</h2>
            </div>

            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              <div>
                <label className="font-medium text-black">Hari</label>
                <select
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl text-black"
                >
                  <option className="text-gray-700" value="">Pilih Hari</option>
                  {[
                    "Senin",
                    "Selasa",
                    "Rabu",
                    "Kamis",
                    "Jumat",
                    "Sabtu",
                    "Minggu",
                  ].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-black">Waktu (HH:MM)</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl text-black"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold"
              >
                <Save className="w-5 h-5 inline mr-1" /> Save Schedule
              </motion.button>
            </form>
          </div>

          {/* Materials */}
          <div className="bg-white/80 p-6 rounded-2xl shadow border">
            <div className="flex items-center gap-3 mb-6">
              <ListOrdered className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-black">Manage Materials</h2>
            </div>

            {/* Form tambah materi */}
            <form
              onSubmit={handleAddMaterial}
              className="space-y-4 mb-6 p-4 border rounded-xl bg-gray-50"
            >
              <h3 className="font-semibold text-gray-700">Add New Material</h3>

              <div>
                <label className="font-medium text-black">Title</label>
                <input
                  type="text"
                  value={newMaterialTitle}
                  onChange={(e) => setNewMaterialTitle(e.target.value)}
                  placeholder="Bab 1: Pengenalan"
                  className="text-black w-full px-4 py-3 border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-black">Type</label>
                  <select
                    value={newMaterialType}
                    onChange={(e) => setNewMaterialType(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl text-black"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-black">URL / Link</label>
                  <input
                    type="text"
                    value={newMaterialUrl}
                    onChange={(e) => setNewMaterialUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full px-4 py-3 border rounded-xl text-black"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold"
              >
                <Plus className="w-5 h-5 inline mr-1" /> Add Material
              </motion.button>
            </form>

            {/* List materi */}
            <h3 className="font-semibold text-gray-700 mb-4">
              Current Materials
            </h3>
            <AnimatePresence>
              {course.materials.length === 0 ? (
                <p className="text-gray-700 text-center py-4">
                  No materials yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {course.materials.map((material) => (
                    <motion.li
                      key={material.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-gray-700"
                    >
                      <div className="flex items-center gap-3 text-gray-700">
                        {material.type === "video" ? (
                          <PlayCircle className="text-indigo-500 w-5 h-5" />
                        ) : (
                          <FileText className="text-green-500 w-5 h-5" />
                        )}
                        <span className="font-medium truncate">
                          {material.title}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleDeleteMaterial(material.id, material.title)
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
