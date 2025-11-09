// File: app/page.js

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">

      <h1 className="text-3xl font-bold mb-6">Login EduConnect</h1>

      <form className="flex flex-col gap-4 w-full max-w-xs">
        <input 
          type="email" 
          placeholder="Email" 
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded" 
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded" 
        />
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
        >
          Login
        </button>
      </form>

    </main>
  );
}