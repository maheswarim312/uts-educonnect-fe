"use client";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Star,
  Users,
  TrendingUp,
  Award,
  Code,
  Palette,
  BarChart3,
  Megaphone,
  ArrowLeft,
  Play,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function CoursesPage() {
  const { user, apiFetch } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [allCourses, setAllCourses] = useState([]);
  const [myEnrollmentIds, setMyEnrollmentIds] = useState(new Set());
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchAllData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const promises = [
            apiFetch("/api/courses"),
            apiFetch("/api/enrollments"),
            apiFetch("/api/users?role=pengajar&per_page=999"),
          ];

          const [courseRes, enrollRes, instructorRes] = await Promise.all(
            promises
          );

          if (
            courseRes.status !== "success" ||
            enrollRes.status !== "success" ||
            instructorRes.status !== "success"
          ) {
            throw new Error("Gagal mengambil data esensial");
          }

          setAllCourses(courseRes.data);
          setInstructors(instructorRes.data);

          const idSet = new Set(enrollRes.data.map((e) => e.course_id));
          setMyEnrollmentIds(idSet);
        } catch (err) {
          setError(err.message);
          toast.error(`Gagal memuat data: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAllData();
    }
  }, [user, apiFetch]);

  
  const handleEnroll = async (courseId, courseTitle) => {
    const loadingToast = toast.loading(`Mendaftarkan ke "${courseTitle}"...`);
    try {
      const res = await apiFetch("/api/enrollments", {
        method: "POST",
        body: JSON.stringify({
          student_id: user.id,
          course_id: courseId,
        }),
      });

      if (res.status !== "success") {
        throw new Error(res.message || "Gagal mendaftar");
      } // SUKSES! Tampilkan toast-nya...

      toast.success("Berhasil terdaftar!", { id: loadingToast }); // TUNGGU SEBENTAR (misal 300 milidetik) BARU UPDATE STATE // Ini memberi waktu agar toast-nya muncul dulu sebelum di-render ulang

      setTimeout(() => {
        setMyEnrollmentIds((prevIds) => new Set(prevIds).add(courseId));
      }, 300); // <-- INI DIA TAMBAHANNYA
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const getInstructorName = (id) => {
    const instructor = instructors.find((i) => i.id === id);
    return instructor ? instructor.name : "N/A";
  };

  const filteredCourses = allCourses.filter((course) => {
    const instructorName = getInstructorName(course.teacher_id);

    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Ambil kategori unik dari allCourses
  const uniqueCategories = [
    ...new Set(allCourses.map((course) => course.category)),
  ];

  const categoryIcons = {
    Programming: Code,
    Design: Palette,
    "Data Science": BarChart3,
    Marketing: Megaphone,
    General: BookOpen,
  };

  const categories = [
    { name: "All", icon: BookOpen, color: "gray" },
    ...uniqueCategories.map((cat) => ({
      name: cat,
      icon: categoryIcons[cat] || BookOpen,
      color: "blue",
    })),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster position="top-right" reverseOrder={false} />
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduConnect
              </span>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Explore Courses 🚀
          </h1>
          <p className="text-gray-600">
            Discover your next learning adventure from our curated collection
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800 shadow-lg"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <motion.button
                key={category.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.name
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "bg-white/80 text-gray-700 hover:bg-white border border-gray-200"
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {isLoading && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">Loading all courses...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg my-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-gray-600">
            Found{" "}
            <span className="font-bold text-blue-600">
              {filteredCourses.length}
            </span>{" "}
            courses
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const isEnrolled = myEnrollmentIds.has(course.id);
            const instructorName = getInstructorName(course.teacher_id);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ y: -8 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-200 shadow-lg group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
                      {course.category}
                    </span>
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                      {course.price}
                    </span>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-blue-600 ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    by {instructorName}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    {course.schedule &&
                      course.schedule.day &&
                      course.schedule.time && (
                        <div className="flex items-center gap-1" title="Jadwal">
                          <Clock className="w-4 h-4" />
                          <span>
                            {course.schedule.day},{" "}
                            {course.schedule.time.substring(0, 5)}
                          </span>
                        </div>
                      )}
                  </div>
                  <button
                    onClick={() =>
                      !isEnrolled && handleEnroll(course.id, course.title)
                    }
                    disabled={isEnrolled}
                    className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                      isEnrolled
                        ? "bg-green-100 text-green-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg"
                    }`}
                  >
                    {isEnrolled ? "Sudah Terdaftar" : "Enroll Now"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
