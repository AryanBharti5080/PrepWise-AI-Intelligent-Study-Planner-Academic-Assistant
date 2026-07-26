"use client";

import { useState } from "react";
import { useEffect  } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";


export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  

  useEffect(() => {
    async function checkUser() {
      const user = await getCurrentUser();

      if (user) {
        router.replace("/dashboard");
      }
    }

    checkUser();
  }, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Registration successful. You can now login.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-xl bg-white p-8 shadow"
      >
       <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">
          Register
        </h1>

        <input
          className="mb-4 w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="mb-4 w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
         className="mb-6 w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>
    </main>
  );
}