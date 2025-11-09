"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null); 
  const router = useRouter();

  // fungsi login
  const login = async (email, password) => {
    setError(null); // Bersihkan error lama

    try {
      const res = await fetch("https://api.uts-educonnect.online/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Simpan user & token ke state
        setUser(data.user);
        setToken(data.token);
        console.log("Disimpan ke Context:", data);
        
        // pindah ke halaman profile
        router.push("/profile"); 
      } else {
        // Jika gagal! Simpan pesan error-nya
        setError(data.message || "Login gagal");
      }
    } catch (err) {
      setError("Tidak bisa nyambung ke server.");
      console.error(err);
    }
  };

  // Fungsi logout
  const logout = () => {
    setUser(null);
    setToken(null);
    router.push("/"); // Balik ke login
  };

  return (
    <AuthContext.Provider value={{ user, token, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};