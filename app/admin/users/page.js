"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Search,
  LogOut,
  ArrowLeft,
  BookOpen,
  Mail,
  Lock,
  User,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Menu } from "@headlessui/react";

export default function AdminUsersPage() {
  const { user, token, loading, logout, apiFetch } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("murid");

  // State baru untuk kontrol Server-Side
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State untuk modal edit
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("murid");

  // State untuk modal "View Profile"
  const [viewingUser, setViewingUser] = useState(null);
  const [profileDetail, setProfileDetail] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Guard: Check if user is admin
  useEffect(() => {
    if (loading) return;

    if (!user) {
      toast.error("Please login first!");
      router.push("/");
      return;
    }

    if (user.role !== "admin") {
      toast.error("Access denied! Admin only.");
      router.push("/dashboard");
      return;
    }
  }, [user, loading, router]);

  // Fetch users data
  useEffect(() => {
    if (user && user.role === "admin") {
      const fetchUsers = async () => {
        try {
          setDataLoading(true);
          setDataError(null);

          const params = new URLSearchParams();
          params.append("page", currentPage);
          params.append("per_page", itemsPerPage);
          params.append("role", roleFilter);
          params.append("search", searchQuery);
          params.append("sort_by", sortConfig.key);
          params.append("sort_direction", sortConfig.direction);

          const data = await apiFetch(`/api/users?${params.toString()}`);

          setUsers(data.data);
          setPaginationInfo(data);

          console.log("Data Users (Paginated):", data);
        } catch (err) {
          setDataError(err.message);
          toast.error(`Failed to load users: ${err.message}`);
        } finally {
          setDataLoading(false);
        }
      };

      fetchUsers();
    }
  }, [
    user,
    apiFetch,
    currentPage,
    roleFilter,
    sortConfig,
    searchQuery,
    refreshTrigger,
  ]);

  useEffect(() => {
    if (viewingUser) {
      const fetchProfileDetails = async () => {
        try {
          setProfileLoading(true);
          setProfileDetail(null);
          setProfileError(null);

          const data = await apiFetch(`/api/users/${viewingUser.id}/profile`);

          setProfileDetail(data);
          console.log("Profile Detail:", data);
        } catch (err) {
          setProfileError(err.message);
          toast.error(`Gagal ambil profil: ${err.message}`);
        } finally {
          setProfileLoading(false);
        }
      };

      fetchProfileDetails();
    }
  }, [viewingUser, apiFetch]);

  // Create new user
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!newName || !newEmail || !newPassword) {
      toast.error("All fields are required!");
      return;
    }

    const loadingToast = toast.loading("Creating new user...");

    try {
      setDataError(null);

      const newUser = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      setCurrentPage(1);

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("murid");

      toast.success(`User "${newUser.data.name}" created successfully!`, {
        id: loadingToast,
      });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  // Delete user
  const handleDelete = async (userId, userName) => {
    const confirmed = confirm(`Are you sure you want to delete "${userName}"?`);
    if (!confirmed) return;

    const loadingToast = toast.loading(`Deleting ${userName}...`);

    try {
      setDataError(null);

      await apiFetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      setRefreshTrigger((key) => key + 1);
      toast.success(`User "${userName}" deleted successfully!`, {
        id: loadingToast,
      });
    } catch (err) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  // Handler saat klik header tabel (untuk sorting)
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Komponen reusable untuk sorting icon
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

  // Handler saat ganti halaman
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handler saat ganti filter
  const handleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setDataError(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const loadingToast = toast.loading(`Updating ${editName}...`);

    try {
      const updatedUserData = await apiFetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
        }),
      });

      setRefreshTrigger((key) => key + 1);

      toast.success(`User "${updatedUserData.data.name}" updated!`, {
        id: loadingToast,
      });

      setEditingUser(null);
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

  // Loading state
  if (loading || !user || user.role !== "admin") {
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
          <p className="text-gray-600 font-medium">Checking admin access...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster position="top-center" />

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
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Admin Panel
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-800">
              User Management
            </h1>
          </div>
          <p className="text-gray-600">
            Manage all users in the system - Create, view, and delete accounts
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-800">
                  {users.length}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Admins</p>
                <p className="text-3xl font-bold text-gray-800">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
              <Shield className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Students</p>
                <p className="text-3xl font-bold text-gray-800">
                  {users.filter((u) => u.role === "murid").length}
                </p>
              </div>
              <BookOpen className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create User Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Create User
                </h2>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-gray-800"
                  >
                    <option value="murid">Student (Murid)</option>
                    <option value="pengajar">Teacher (Pengajar)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Create User
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    All Users
                  </h2>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                  />
                </div>

                {/* Filter by Role */}
                <div className="relative sm:w-64">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    value={roleFilter}
                    onChange={handleFilterChange}
                    className="w-full pl-12 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800 appearance-none cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="murid">🎓 Student</option>
                    <option value="pengajar">👨‍🏫 Teacher</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Loading State */}
              {dataLoading && (
                <div className="text-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                  />
                  <p className="text-gray-600">Loading users...</p>
                </div>
              )}

              {/* Error State */}
              {dataError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 font-medium">{dataError}</p>
                  </div>
                </div>
              )}

              {/* Users Table */}
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
                          onClick={() => requestSort("name")}
                        >
                          <div className="flex items-center gap-2">
                            Name
                            <SortIcon columnKey="name" />
                          </div>
                        </th>
                        <th
                          className="text-left p-4 text-gray-600 font-semibold cursor-pointer hover:bg-gray-50 transition-colors group"
                          onClick={() => requestSort("email")}
                        >
                          <div className="flex items-center gap-2">
                            Email
                            <SortIcon columnKey="email" />
                          </div>
                        </th>
                        <th
                          className="text-left p-4 text-gray-600 font-semibold cursor-pointer hover:bg-gray-50 transition-colors group"
                          onClick={() => requestSort("role")}
                        >
                          <div className="flex items-center gap-2">
                            Role
                            <SortIcon columnKey="role" />
                          </div>
                        </th>
                        <th className="text-left p-4 text-gray-600 font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {users.map((u, index) => (
                          <motion.tr
                            key={u.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-4 text-gray-600">#{u.id}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-800">
                                  {u.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">{u.email}</td>
                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  u.role === "admin"
                                    ? "bg-green-100 text-green-700"
                                    : u.role === "pengajar"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {u.role}
                              </span>
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
                                          onClick={() => setViewingUser(u)}
                                          className={`${
                                            active
                                              ? "bg-green-50 text-green-700"
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
                                          onClick={() => openEditModal(u)}
                                          className={`${
                                            active
                                              ? "bg-blue-50 text-blue-700"
                                              : "text-gray-700"
                                          } group flex w-full items-center rounded-lg p-3 text-sm transition-colors`}
                                        >
                                          <Edit className="w-5 h-5 mr-3" />
                                          Edit User
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() =>
                                            handleDelete(u.id, u.name)
                                          }
                                          className={`${
                                            active
                                              ? "bg-red-50 text-red-700"
                                              : "text-gray-700"
                                          } group flex w-full items-center rounded-lg p-3 text-sm transition-colors`}
                                        >
                                          <Trash2 className="w-5 h-5 mr-3" />
                                          Hapus User
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

                  {/* Empty State */}
                  {users.length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        No users found
                      </p>
                      <p className="text-gray-500 text-sm">
                        {searchQuery
                          ? "Try adjusting your search"
                          : "Create your first user to get started"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination Controls (Improved) */}
              {paginationInfo && paginationInfo.last_page > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
                  {/* Info Text */}
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
                    users
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600"
                      }`}
                    >
                      Previous
                    </motion.button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: paginationInfo.last_page },
                        (_, i) => i + 1
                      )
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === paginationInfo.last_page ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          );
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

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
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600"
                                }`}
                              >
                                {page}
                              </motion.button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Next Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === paginationInfo.last_page}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === paginationInfo.last_page
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600"
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

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingUser(null)}
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
                    Edit User: {editingUser.name}
                  </h2>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-800"
                  >
                    <option value="murid">Student (Murid)</option>
                    <option value="pengajar">Teacher (Pengajar)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <p className="text-sm text-gray-500">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Password tidak bisa diubah dari sini. Jika perlu, hapus dan
                  buat ulang.
                </p>

                <div className="flex justify-end gap-3 pt-4">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditingUser(null)}
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

      {/* View Profile Modal */}
      <AnimatePresence>
        {viewingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewingUser(null)}
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
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Detail Profil
                    </h2>
                    <p className="text-gray-600">
                      {viewingUser.name} ({viewingUser.email})
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 min-h-[200px]">
                {profileLoading && (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-600">Memuat detail profil...</p>
                  </div>
                )}

                {profileError && (
                  <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
                    <p>Error: {profileError}</p>
                  </div>
                )}

                {profileDetail && !profileLoading && (
                  <div>
                    {profileDetail.status === "success" && (
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {Object.entries(profileDetail.data).map(
                          ([key, value]) =>
                            key !== "id" &&
                            key !== "user_id" &&
                            value && (
                              <div
                                key={key}
                                className="border-b border-gray-100 pb-2"
                              >
                                <dt className="text-sm font-medium text-gray-500 capitalize">
                                  {key}
                                </dt>
                                <dd className="text-lg font-semibold text-gray-800">
                                  {value}
                                </dd>
                              </div>
                            )
                        )}
                      </dl>
                    )}

                    {profileDetail.status === "info" && (
                      <p className="text-center text-gray-600 p-8">
                        {profileDetail.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-b-2xl flex justify-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewingUser(null)}
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
