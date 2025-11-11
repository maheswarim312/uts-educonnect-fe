"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Trash2,
  Edit,
  Search,
  LogOut,
  ArrowLeft,
  BookOpen,
  Eye,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ListOrdered,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Menu } from "@headlessui/react";

export default function AdminCoursesPage() {
  const { user, token, loading, logout, apiFetch } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [instructors, setInstructors] = useState([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newInstructorId, setNewInstructorId] = useState("");
  const [newThumbnail, setNewThumbnail] = useState("");
  const [newCategory, setNewCategory] = useState("General");

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState(null);

  const [editingCourse, setEditingCourse] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInstructorId, setEditInstructorId] = useState("");
  const [editThumbnail, setEditThumbnail] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [viewingCourse, setViewingCourse] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast.error("Please login first!");
      router.push("/");
      return;
    }

    if (user.role !== "admin" && user.role !== "pengajar") {
      toast.error("Access denied! Admin or Teacher only.");
      router.push("/dashboard");
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setInstructorsLoading(true);
        const data = await apiFetch("/api/users?role=pengajar&per_page=999");
        setInstructors(data.data || []);
        if (data.data && data.data.length > 0) {
          setNewInstructorId(data.data[0].id);
        }
      } catch (err) {
        toast.error(`Failed to load instructors: ${err.message}`);
      } finally {
        setInstructorsLoading(false);
      }
    };
    if (user && (user.role === "admin" || user.role === "pengajar")) {
      fetchInstructors();
    }
  }, [user, apiFetch]);

  useEffect(() => {
    if (instructors.length === 0) {
      if (user && (user.role === "admin" || user.role === "pengajar")) {
        setDataLoading(false);
      }
      return;
    }

    if (user && (user.role === "admin" || user.role === "pengajar")) {
      const fetchCourses = async () => {
        try {
          setDataLoading(true);
          setDataError(null);

          const params = new URLSearchParams();
          params.append("page", currentPage);
          params.append("per_page", itemsPerPage);
          params.append("search", searchQuery);
          params.append("sort_by", sortConfig.key);
          params.append("sort_direction", sortConfig.direction);

          if (user.role === "pengajar") {
            params.append("teacher_id", user.id);
          }

          const data = await apiFetch(`/api/courses?${params.toString()}`);

          setCourses(data.data || []);
          setPaginationInfo(data);
        } catch (err) {
          setDataError(err.message);
          toast.error(`Failed to load courses: ${err.message}`);
        } finally {
          setDataLoading(false);
        }
      };

      fetchCourses();
    }
  }, [
    user,
    apiFetch,
    currentPage,
    sortConfig,
    searchQuery,
    instructors,
    itemsPerPage,
  ]);

  useEffect(() => {
    if (viewingCourse) {
      const fetchCourseDetails = async () => {
        try {
          setDetailLoading(true);
          setDetailData(null);
          setDetailError(null);

          const data = await apiFetch(`/api/courses/${viewingCourse.id}`);

          setDetailData(data.data);
        } catch (err) {
          setDetailError(err.message);
          toast.error(`Gagal ambil detail kursus: ${err.message}`);
        } finally {
          setDetailLoading(false);
        }
      };

      fetchCourseDetails();
    }
  }, [viewingCourse, apiFetch]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!newTitle || !newDescription || !newInstructorId) {
      toast.error("Title, Description, and Instructor are required!");
      return;
    }

    const loadingToast = toast.loading("Creating new course...");

    try {
      setDataError(null);

      const newCourse = await apiFetch("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          teacher_id: newInstructorId,
          thumbnail: newThumbnail,
          category: newCategory,
        }),
      });

      setCourses((prev) => [newCourse.data, ...prev]);

      setNewTitle("");
      setNewDescription("");
      setNewThumbnail("");
      setNewCategory("General");

      toast.success(`Course "${newCourse.data.title}" created successfully!`, {
        id: loadingToast,
      });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleDelete = async (courseId, courseTitle) => {
    const confirmed = confirm(
      `Are you sure you want to delete course "${courseTitle}"?`
    );
    if (!confirmed) return;

    const loadingToast = toast.loading(`Deleting ${courseTitle}...`);

    try {
      setDataError(null);

      await apiFetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      setCourses((prev) => prev.filter((course) => course.id !== courseId));
      toast.success(`Course "${courseTitle}" deleted successfully!`, {
        id: loadingToast,
      });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditDescription(course.description || "");
    setEditInstructorId(course.teacher_id);
    setEditThumbnail(course.thumbnail || "");
    setEditCategory(course.category || "General");
    setDataError(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;

    const loadingToast = toast.loading(`Updating ${editTitle}...`);

    try {
      const updatedCourseData = await apiFetch(
        `/api/courses/${editingCourse.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: editTitle,
            description: editDescription,
            teacher_id: editInstructorId,
            thumbnail: editThumbnail,
            category: editCategory,
          }),
        }
      );

      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id ? updatedCourseData.data : c
        )
      );

      toast.success(`Course "${updatedCourseData.data.title}" updated!`, {
        id: loadingToast,
      });

      setEditingCourse(null);
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleLogout = () => {
    setTimeout(() => {
      logout();
      toast.success("Logged out successfully!");
    }, 500);
  };

  if (loading || !user || (user.role !== "admin" && user.role !== "pengajar")) {
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
          <p className="text-gray-600 font-medium">Checking access...</p>
        </motion.div>
      </div>
    );
  }

  const getInstructorName = (teacherId) => {
    const instructor = instructors.find((i) => i.id === teacherId);
    return instructor ? instructor.name : "N/A";
  };

  const safeCourses = courses || [];
  const totalCourses = paginationInfo
    ? paginationInfo.total
    : safeCourses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster position="top-center" />

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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {user.role === "admin" ? "Admin Panel" : "Teacher Panel"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-indigo-500" />
            <h1 className="text-4xl font-bold text-gray-800">
              Course Management
            </h1>
          </div>
          <p className="text-gray-600">
            Manage all courses in the system - Create, view, and delete courses.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Courses</p>
                <p className="text-3xl font-bold text-gray-800">
                  {totalCourses}
                </p>
              </div>
              <ListOrdered className="w-12 h-12 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Instructors</p>
                <p className="text-3xl font-bold text-gray-800">
                  {instructors.length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Create Course
                </h2>
              </div>

              {instructorsLoading ? (
                <p className="text-gray-500">Loading instructors...</p>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Web Development Basics"
                        className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-800"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Short description about the course content"
                      rows="3"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-800 resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                     Thumbnail URL
                    </label>
                    <input
                      type="text"
                      value={newThumbnail}
                      onChange={(e) => setNewThumbnail(e.target.value)}
                      placeholder="https://image-url.com/foto.png"
                      className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category                    
                      </label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Programming"
                      className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructor
                    </label>
                    <select
                      value={newInstructorId}
                      onChange={(e) => setNewInstructorId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-800"
                      required
                    >
                      {instructors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    Create Course
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ListOrdered className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    All Courses
                  </h2>
                </div>
              </div>

              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title or instructor..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-800"
                  />
                </div>
              </div>

              {dataLoading && (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-gray-600">Loading courses...</p>
                </div>
              )}

              {dataError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 font-medium">{dataError}</p>
                  </div>
                </div>
              )}

              {!dataLoading && !dataError && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th
                          className="text-left p-4 text-gray-600 font-semibold cursor-pointer hover:bg-gray-50 transition-colors group"
                          onClick={() => requestSort("id")}
                        >
                          <div className="flex items-center gap-2">
                            ID
                            <SortIcon columnKey="id" />
                          </div>
                        </th>
                        <th
                          className="text-left p-4 text-gray-600 font-semibold cursor-pointer hover:bg-gray-50 transition-colors group"
                          onClick={() => requestSort("title")}
                        >
                          <div className="flex items-center gap-2">
                            Title
                            <SortIcon columnKey="title" />
                          </div>
                        </th>
                        <th className="text-left p-4 text-gray-600 font-semibold">
                          Instructor
                        </th>
                        <th className="text-left p-4 text-gray-600 font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {safeCourses.map((c, index) => (
                          <motion.tr
                            key={c.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-4 text-gray-600">#{c.id}</td>
                            <td className="p-4">
                              <span className="font-medium text-gray-800">
                                {c.title}
                              </span>
                            </td>
                            <td className="p-4 text-gray-600 font-medium">
                              {getInstructorName(c.teacher_id)}
                            </td>
                            <td className="p-4">
                              <Menu
                                as="div"
                                className="relative inline-block text-left"
                              >
                                <div>
                                  <Menu.Button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
                                    <MoreVertical className="w-5 h-5" />
                                  </Menu.Button>
                                </div>

                                <AnimatePresence>
                                  <Menu.Items
                                    as={motion.div}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 p-2"
                                  >
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => setViewingCourse(c)}
                                          className={`${
                                            active
                                              ? "bg-indigo-50 text-indigo-700"
                                              : "text-gray-700"
                                          } group flex w-full items-center rounded-lg p-3 text-sm transition-colors`}
                                        >
                                          <Eye className="w-5 h-5 mr-3" />
                                          Lihat Detail
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => openEditModal(c)}
                                          className={`${
                                            active
                                              ? "bg-blue-50 text-blue-700"
                                              : "text-gray-700"
                                          } group flex w-full items-center rounded-lg p-3 text-sm transition-colors`}
                                        >
                                          <Edit className="w-5 h-5 mr-3" />
                                          Edit Course
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <Link
                                          href={`/admin/courses_admin/${c.id}/manage-content`}
                                          className={`${
                                            active
                                              ? "bg-purple-50 text-purple-700"
                                              : "text-gray-700"
                                          } group flex w-full items-center rounded-lg p-3 text-sm transition-colors`}
                                        >
                                          <Calendar className="w-5 h-5 mr-3" />
                                          Kelola Konten/Jadwal
                                        </Link>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            handleDelete(c.id, c.title)
                                          }
                                          className={`${
                                            active
                                              ? "bg-red-50 text-red-700"
                                              : "text-gray-700"
                                          } group flex w-full items-center rounded-lg p-3 text-sm transition-colors`}
                                        >
                                          <Trash2 className="w-5 h-5 mr-3" />
                                          Hapus Course
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </Menu.Items>
                                </AnimatePresence>
                              </Menu>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>

                  {safeCourses.length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        No courses found
                      </p>
                      <p className="text-gray-500 text-sm">
                        {searchQuery
                          ? "Try adjusting your search"
                          : "Create your first course to get started"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {paginationInfo && paginationInfo.last_page > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-gray-800">
                      {paginationInfo.from || 0}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-gray-800">
                      {paginationInfo.to || 0}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-gray-800">
                      {paginationInfo.total || 0}
                    </span>{" "}
                    courses
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-500 hover:text-purple-600"
                      }`}
                    >
                      Previous
                    </motion.button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: paginationInfo.last_page },
                        (_, i) => i + 1
                      ).filter((page) => {
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handlePageChange(page)}
                              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                                  : "bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-500 hover:text-purple-600"
                              }`}
                            >
                              {page}
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationInfo.last_page}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === paginationInfo.last_page
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-500 hover:text-purple-600"
                      }`}
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {editingCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Edit Course: {editingCourse.title}
                  </h2>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thumbnail URL
                  </label>
                  <input
                    type="text"
                    value={editThumbnail}
                    onChange={(e) => setEditThumbnail(e.target.value)}
                    placeholder="https://image-url.com/foto.png"
                    className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="Programming"
                    className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructor
                  </label>
                  <select
                    value={editInstructorId}
                    onChange={(e) => setEditInstructorId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                  >
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingCourse(null)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewingCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Eye className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Detail Course
                    </h2>
                    <p className="text-gray-600">
                      {viewingCourse.title} (ID: #{viewingCourse.id})
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 min-h-[200px]">
                {detailLoading && (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-600">Memuat detail kursus...</p>
                  </div>
                )}

                {detailError && (
                  <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
                    <p>Error: {detailError}</p>
                  </div>
                )}

                {detailData && !detailLoading && (
                  <div>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="border-b border-gray-100 pb-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Title
                        </dt>
                        <dd className="text-lg font-semibold text-gray-800">
                          {detailData.title}
                        </dd>
                      </div>

                      <div className="border-b border-gray-100 pb-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Instructor
                        </dt>
                        <dd className="text-lg font-semibold text-gray-800">
                          {getInstructorName(detailData.teacher_id)}
                        </dd>
                      </div>

                      {detailData.createdAt && (
                        <div className="border-b border-gray-100 pb-2">
                          <dt className="text-sm font-medium text-gray-500">
                            Created At
                          </dt>
                          <dd className="text-lg font-semibold text-gray-800">
                            {new Date(
                              detailData.createdAt
                            ).toLocaleDateString()}
                          </dd>
                        </div>
                      )}

                      {detailData.category && (
                        <div className="border-b border-gray-100 pb-2">
                          <dt className="text-sm font-medium text-gray-500">
                            Category
                          </dt>
                          <dd className="text-lg font-semibold text-gray-800">
                            {detailData.category}
                          </dd>
                        </div>
                      )}

                      <div className="border-b border-gray-100 pb-2 md:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">
                          Description
                        </dt>
                        <dd className="text-base text-gray-800 whitespace-pre-wrap">
                          {detailData.description || "No description available"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-b-2xl flex justify-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewingCourse(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold"
                >
                  Tutup
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
