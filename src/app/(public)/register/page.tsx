import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Register</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create your account to begin setting up your church workspace.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
