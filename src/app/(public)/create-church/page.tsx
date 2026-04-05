import Link from "next/link";
import { CreateChurchForm } from "./CreateChurchForm";

export default function CreateChurchPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Church</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a new church workspace. You will become its church admin.
          </p>
        </div>

        <CreateChurchForm />

        <p className="mt-6 text-sm text-gray-600">
          <Link href="/login" className="underline hover:text-gray-800">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
