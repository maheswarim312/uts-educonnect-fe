"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ArrowLeft,
  Users,
  User,
  GraduationCap,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Mail,
  CalendarDays,
  Clock,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function TeacherCourseStudentsPage() {
  const { user, loading, apiFetch } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id;

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({}); // { studentId: gradeObject }
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // State untuk form edit grade
  const [editingGrade, setEditingGrade] = useState(null); // { studentId, grade, remarks }
  const [editGradeValue, setEditGradeValue] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/");
      return;
    }

    if (user.role !== "pengajar") {
      toast.error("Akses ditolak! Hanya untuk pengajar.");
      router.push("/dashboard");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && courseId && user.role === "pengajar") {
      fetchCourseData();
    }
  }, [user, courseId, apiFetch]);

  const fetchCourseData = async () => {
    try {
      setLoadingData(true);
      setError(null);

      // Fetch course details
      const courseRes = await apiFetch(`/api/courses/${courseId}`);
      if (courseRes.status !== "success") {
        throw new Error(courseRes.message || "Course tidak ditemukan");
      }

      // Verify that this course belongs to the teacher
      if (courseRes.data.teacher_id !== user.id) {
        toast.error("Anda tidak memiliki akses ke course ini!");
        router.push("/dashboard");
        return;
      }

      setCourse(courseRes.data);

      // Fetch enrollments (students)
      const enrollmentsRes = await apiFetch(
        `/api/enrollments?course_id=${courseId}`
      );
      if (enrollmentsRes.status !== "success") {
        throw new Error(
          enrollmentsRes.message || "Gagal mengambil data enrollment"
        );
      }

      const enrollments = enrollmentsRes.data || [];

      // Fetch all students (murid) to get their details
      let allStudents = [];
      try {
        const studentsRes = await apiFetch(
          `/api/users?role=murid&per_page=999`
        );
        // Handle both paginated and non-paginated responses
        if (studentsRes.status === "success") {
          allStudents = studentsRes.data || [];
        } else if (Array.isArray(studentsRes)) {
          allStudents = studentsRes;
        }
      } catch (e) {
        console.error("Gagal mengambil data students:", e);
        // Continue with empty array - will show student IDs only
      }

      // Match enrollments with student details and fetch profiles for NIM
      const studentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = allStudents.find(
            (s) => s.id === enrollment.student_id
          );

          let profile = null;
          // Try to fetch profile for NIM (may fail if not admin)
          try {
            const profileRes = await apiFetch(
              `/api/users/${enrollment.student_id}/profile`
            );
            if (profileRes && !profileRes.error) {
              profile = profileRes;
            }
          } catch (e) {
            // Silently fail - profile is optional
          }

          return {
            ...enrollment,
            student: student
              ? {
                  ...student,
                  nim: profile?.nim || null,
                }
              : {
                  id: enrollment.student_id,
                  name: "Unknown",
                  email: "-",
                  nim: profile?.nim || null,
                },
          };
        })
      );

      setStudents(studentsWithDetails);

      // Fetch grades for this course
      const gradesRes = await apiFetch(`/api/grades?courseID=${courseId}`);
      if (gradesRes.status === "success" && gradesRes.data) {
        const gradesMap = {};
        gradesRes.data.forEach((grade) => {
          gradesMap[grade.studentID] = grade;
        });
        setGrades(gradesMap);
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const handleEditGrade = (studentId, studentName) => {
    const existingGrade = grades[studentId];
    setEditingGrade({
      studentId,
      studentName,
      gradeId: existingGrade?.id || null,
    });
    setEditGradeValue(existingGrade?.grade || "");
    setEditRemarks(existingGrade?.remarks || "");
  };

  const handleCancelEdit = () => {
    setEditingGrade(null);
    setEditGradeValue("");
    setEditRemarks("");
  };

  const handleSaveGrade = async () => {
    if (!editGradeValue.trim()) {
      toast.error("Grade tidak boleh kosong!");
      return;
    }

    const loadingToast = toast.loading("Menyimpan nilai...");

    try {
      const gradeData = {
        studentID: editingGrade.studentId,
        courseID: parseInt(courseId),
        teacherID: user.id,
        grade: editGradeValue.trim(),
        remarks: editRemarks.trim() || null,
      };

      let result;
      if (editingGrade.gradeId) {
        // Update existing grade
        result = await apiFetch(`/api/grades/${editingGrade.gradeId}`, {
          method: "PUT",
          body: JSON.stringify(gradeData),
        });
      } else {
        // Create new grade
        result = await apiFetch("/api/grades", {
          method: "POST",
          body: JSON.stringify(gradeData),
        });
      }

      if (result.status === "success" || result.id) {
        // Update local state
        setGrades((prev) => ({
          ...prev,
          [editingGrade.studentId]: {
            id: result.id || editingGrade.gradeId,
            studentID: editingGrade.studentId,
            courseID: parseInt(courseId),
            teacherID: user.id,
            grade: editGradeValue.trim(),
            remarks: editRemarks.trim() || null,
          },
        }));

        toast.success(
          `Nilai untuk ${editingGrade.studentName} berhasil disimpan!`,
          { id: loadingToast }
        );
        handleCancelEdit();
      } else {
        throw new Error(result.message || "Gagal menyimpan nilai");
      }
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  if (loading || loadingData || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Memuat data...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-lg max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium px-6 py-3 rounded-lg hover:shadow-lg transition-all"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster />

      {/* Top Navigation */}
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
                className="w-10 h-10 bg-white/80 backdrop-blur-lg rounded-full flex items-center justify-center border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">
                    {course?.title || "Loading..."}
                  </h1>
                  <p className="text-sm text-gray-500">Daftar Murid</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info Card */}
        {course && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg mb-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {course.title}
                </h2>
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{students.length} Murid Terdaftar</span>
                  </div>
                  {course.schedule && (
                    <>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        <span>
                          {course.schedule.day}, {course.schedule.time}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{course.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                Daftar Murid ({students.length})
              </h2>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Belum ada murid yang terdaftar
              </p>
              <p className="text-gray-500">
                Murid akan muncul di sini setelah mendaftar ke course ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nama Murid
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Catatan
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((enrollment, index) => {
                    const student = enrollment.student;
                    const grade = grades[enrollment.student_id];
                    const isEditing =
                      editingGrade?.studentId === enrollment.student_id;

                    return (
                      <motion.tr
                        key={enrollment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {student.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-800">
                                {student.name || "Unknown"}
                              </div>
                              {student.nim && (
                                <div className="text-xs text-gray-500">
                                  NIM: {student.nim}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.email || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editGradeValue}
                              onChange={(e) => setEditGradeValue(e.target.value)}
                              placeholder="A, B+, B, C+, dll"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              maxLength={5}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {grade ? (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                  {grade.grade}
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                  Belum ada
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRemarks}
                              onChange={(e) => setEditRemarks(e.target.value)}
                              placeholder="Catatan (opsional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {grade?.remarks || "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={handleSaveGrade}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                title="Simpan"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                title="Batal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                handleEditGrade(
                                  enrollment.student_id,
                                  student.name
                                )
                              }
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              title="Edit Nilai"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

