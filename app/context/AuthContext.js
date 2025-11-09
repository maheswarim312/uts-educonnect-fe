"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("educonnect_token");
    const storedUser = localStorage.getItem("educonnect_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // fungsi login
  const login = async (email, password) => {
    setError(null); // Bersihkan error lama

    try {
      const res = await fetch(
        "https://api.uts-educonnect.online/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Simpan user & token ke state
        setUser(data.user);
        setToken(data.token);

        localStorage.setItem("educonnect_token", data.token);
        localStorage.setItem("educonnect_user", JSON.stringify(data.user));

        console.log("Disimpan ke Context & localStorage:", data);

        router.push("/dashboard");
      } else {
        // Jika gagal! Simpan pesan error-nya
        setError(data.message || "Login gagal");
      }
    } catch (err) {
      setError("Tidak bisa nyambung ke server.");
      console.error(err);
    }
  };

  const register = async (name, email, password) => {
    setError(null);

    try {
      const res = await fetch(
        "https://api.uts-educonnect.online/api/v1/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        console.log("Registrasi Berhasil:", data);
        router.push("/");
      } else {
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ");
          setError(errorMessages);
        } else {
          setError(data.message || "Registrasi gagal");
        }
      }
    } catch (err) {
      setError("Tidak bisa nyambung ke server.");
      console.error(err);
    }
  };

  const apiFetch = async (endpoint, options = {}) => {
    // 1. Ambil token dari "memori" brankas
    // Kita pakai 'useState' (token) di sini biar 'realtime',
    // tapi 'localStorage' juga bisa jadi cadangan
    const storedToken = token || localStorage.getItem("educonnect_token");

    // 2. Siapkan header default
    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${storedToken}`, // <-- INI KUNCINYA
    };

    // 3. Gabungkan header default dengan header tambahan (jika ada)
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // 4. Panggil "Terminal" kita
    const res = await fetch(
      `https://api.uts-educonnect.online${endpoint}`,
      config
    );

    // 5. "Satpam" Token (Jaga-jaga kalau token expired)
    if (res.status === 401) {
      // Token tidak valid!
      logout(); // Paksa logout
      throw new Error("Token tidak valid, silakan login ulang");
    }

    if (!res.ok) {
      // Tangani error API lainnya
      const errorData = await res.json();

      // INI LOGIKA BARU UNTUK TANGKAP ERROR 422 (VALIDASI)
      // (Kita comot dari fungsi 'register' kita yang udah pinter)
      if (res.status === 422 && errorData.errors) {
        const errorMessages = Object.values(errorData.errors).flat().join(", ");
        throw new Error(errorMessages); // Cth: "The password must be at least 8 characters."
      }

      // Ini untuk error lain (404, 500, dll)
      throw new Error(errorData.message || "Terjadi kesalahan API");
    }

    // 6. Kalau sukses, kembalikan datanya
    return res.json();
  };

  // Fungsi logout
  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);

    localStorage.removeItem("educonnect_token");
    localStorage.removeItem("educonnect_user");

    router.push("/"); // Balik ke login
  };

  return (
    <AuthContext.Provider
      value={{ user, token, error, loading, login, logout, register, apiFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
