// File: app/page.js

"use client";

// import "memori" React
import { useState } from "react";

export default function Home() {
  
  // siapkan state untuk simpan email, pass, dan pesan
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(""); // Untuk pesan error/sukses

  // fungsi saat form di-submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Biar halaman nggak refresh
    setMessage("Lagi login, tunggu..."); // Kasih feedback ke user

    try {
      // call "Terminal"
      const res = await fetch("https://api.uts-educonnect.online/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Kalau status 200
        setMessage("Login Berhasil! Token kamu ada di console.");
        console.log("Data Login:", data); // Tampilkan semua data (user & token)
      } else {
        // Kalau GAGAL (status 401, 422, dll)
        setMessage(`Error: ${data.message || 'Login gagal, cek email/pass'}`);
      }
    
    } catch (error) {
      // Kalau server-nya mati atau gak nyambung
      setMessage("Error: Nggak bisa nyambung ke server Terminal.");
      console.error(error);
    }
  };

  // sambungkan HTML-nya ke "memori" dan "fungsi"
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      
      <h1 className="text-3xl font-bold mb-6">Login EduConnect</h1>
      
      {/* pakai 'onSubmit' di <form>, bukan 'onClick' di <button> */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        
        <input 
          type="email" 
          placeholder="Email" 
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
          // Sambungkan ke "memori" email
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
          // Sambungkan ke "memori" password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Login
        </button>

        {/* Tampilkan pesan error/sukses */}
        {message && <p className="text-white mt-4">{message}</p>}

      </form>

    </main>
  );
}