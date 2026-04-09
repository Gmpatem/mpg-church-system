import Link from "next/link";
import { Church } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950">
                <Church className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">MPG Church</span>
            </Link>
            <p className="text-sm text-slate-500 max-w-xs">
              A complete church management platform for modern ministries. 
              Members, staff, and treasury in one place.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#features" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#workflow" className="text-slate-500 hover:text-slate-900 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#roles" className="text-slate-500 hover:text-slate-900 transition-colors">
                  For Your Role
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/create-church" className="text-slate-500 hover:text-slate-900 transition-colors">
                  Create Church
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-500">
                  Built for SDA churches
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  English & French support
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  Secure, role-based access
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} MPG Church Systems. All rights reserved.
          </p>
          <p className="text-sm text-slate-400">
            Church management made simple.
          </p>
        </div>
      </div>
    </footer>
  );
}
