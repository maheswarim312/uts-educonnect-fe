"use client";

import { useState } from "react";
import { useAuth } from "./context/AuthContext"; 

export default function Home() {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, error } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      
      <h1 className="text-3xl font-bold mb-6">Login EduConnect</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        
        <input 
          type="email" 
          placeholder="Email" 
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Login
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

      </form>

    </main>
  );
}