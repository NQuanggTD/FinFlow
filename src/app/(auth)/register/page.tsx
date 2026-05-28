import { RegisterForm } from "@/components/auth/RegisterForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign up – FinFlow" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-3 shadow-lg">
              <span className="text-2xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create a new account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Start your smart financial journey
            </p>
          </div>
          <RegisterForm />
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          FinFlow © 2026 · Secured by Supabase Auth
        </p>
      </div>
    </main>
  );
}
