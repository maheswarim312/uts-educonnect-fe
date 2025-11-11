"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  LogOut,
  User,
  Clock,
  Award,
  TrendingUp,
  Play,
  Star,
  Users,
  ChevronRight,
  Shield,
  Sparkles,
  GraduationCap,
  BarChart,
  ListOrdered,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function DashboardPage() {
  const { user, token, logout, loading } = useAuth();
  const router = useRouter();
  const [greeting, setGreeting] = useState("");

  // Dummy data courses - nanti bisa diganti dengan API call
  const courses = [
    {
      id: 1,
      title: "Web Development Fundamentals",
      instructor: "Dr. Sarah Johnson",
      progress: 65,
      thumbnail: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&h=250&fit=crop",
      duration: "12 hours",
      rating: 4.8,
      students: 1234,
      category: "Programming",
    },
    {
      id: 2,
      title: "UI/UX Design Masterclass",
      instructor: "Alex Chen",
      progress: 40,
      thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
      duration: "8 hours",
      rating: 4.9,
      students: 890,
      category: "Design",
    },
    {
      id: 3,
      title: "Data Science with Python",
      instructor: "Prof. Michael Brown",
      progress: 20,
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
      duration: "15 hours",
      rating: 4.7,
      students: 2100,
      category: "Data Science",
    },
    {
      id: 4,
      title: "Digital Marketing Strategy",
      instructor: "Emma Wilson",
      progress: 0,
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
      duration: "6 hours",
      rating: 4.6,
      students: 567,
      category: "Marketing",
    },
  ];

  const stats = [
    { label: "Courses Enrolled", value: "4", icon: BookOpen, color: "blue" },
    { label: "Hours Learned", value: "27", icon: Clock, color: "purple" },
    { label: "Certificates", value: "2", icon: Award, color: "yellow" },
    { label: "Course Progress", value: "31%", icon: TrendingUp, color: "green" },
  ];

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
    } else {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Selamat Pagi");
      else if (hour < 18) setGreeting("Selamat Siang");
      else setGreeting("Selamat Malam");
      
      toast.success(`Welcome back, ${user.name}! 🎉`, {
        duration: 3000,
        position: "top-center",
      });
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    toast.loading("Logging out...");
    setTimeout(() => {
      logout();
      toast.success("Logged out successfully!");
    }, 500);
  };

  if (loading || !user) {
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
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </motion.div>
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EduConnect
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {user.role === "admin" && (
                <Link
                  href="/admin/users"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            
              {(user.role === "admin" || user.role === "pengajar") && (
                <Link
                  href="/admin/courses_admin" // Ganti dengan URL halaman manajemen kursus yang kamu buat
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <ListOrdered className="w-4 h-4" />
                  Courses
                </Link>
              )}
              
              <Link
                href="/profile"
                className="w-10 h-10 bg-white/80 backdrop-blur-lg rounded-full flex items-center justify-center border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-all"
                title="Edit Profil Kamu"
              >
                <User className="w-5 h-5" />
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-800">
              {greeting}, {user.name}! 👋
            </h1>
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-gray-600">
            Siap untuk melanjutkan perjalanan belajarmu hari ini?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 bg-${stat.color}-100 rounded-xl`}
                >
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">My Courses</h2>
            </div>
            <Link
              href="/courses"
              className="flex items-center gap-2 text-blue-600 hover:text-purple-600 font-medium transition-colors"
            >
              Browse All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-200 shadow-lg group"
              >
                {/* Course Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-800">
                    {course.category}
                  </div>
                  {course.progress > 0 && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-white text-sm mb-2">
                        <span>Progress</span>
                        <span className="font-bold">{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <User className="w-4 h-4" />
                    <span>{course.instructor}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-gray-700 font-semibold">{course.rating}</span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all group">
                    {course.progress > 0 ? (
                      <>
                        Continue Learning
                        <Play className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        Start Course
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Learning Analytics (Optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-800">This Week's Activity</h3>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-xs text-gray-600 mb-2">{day}</div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.random() * 80 + 20}px` }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="bg-gradient-to-t from-blue-500 to-purple-600 rounded-lg mx-auto"
                  style={{ width: "100%" }}
                />
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-sm mt-4">
            Keep up the great work! 🔥 You've been consistent this week.
          </p>
        </motion.div>
      </div>
    </div>
  );
}