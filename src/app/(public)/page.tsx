import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Building2,
  CalendarCheck,
  Wallet,
  Calendar,
  BarChart3,
  Church,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MPG Church Systems - Church Management Platform",
  description:
    "A complete church management platform designed for modern ministries.",
};

const features = [
  {
    icon: Users,
    title: "Member Management",
    description:
      "Comprehensive member directory with profiles, status tracking, and history",
  },
  {
    icon: Building2,
    title: "Departments & Teams",
    description:
      "Organize your church into departments with role assignments",
  },
  {
    icon: CalendarCheck,
    title: "Attendance Tracking",
    description:
      "Track attendance for services, events, and small groups",
  },
  {
    icon: Wallet,
    title: "Financial Management",
    description:
      "Manage income, expenses, and generate financial reports",
  },
  {
    icon: Calendar,
    title: "Event Planning",
    description:
      "Plan and manage church events with scheduling and coordination",
  },
  {
    icon: BarChart3,
    title: "Insights & Reports",
    description:
      "Get valuable insights with detailed reports and analytics",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Church className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">MPG Church Systems</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Login
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-background to-muted/20 py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Now available for churches worldwide
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
              Manage Your Church with{" "}
              <span className="text-primary">Confidence</span>
            </h1>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              A complete church management platform designed for modern
              ministries. Track members, manage departments, handle finances,
              and grow your community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-8">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Built for SDA churches</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Members + Staff + Treasury in one place</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Invite-based member onboarding</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You Need
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-lg">
              Powerful tools to help you manage every aspect of your church
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-4xl font-bold text-primary">EN + FR</div>
              <div className="text-sm text-muted-foreground">
                English and French support
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-4xl font-bold text-primary">Multi-tenant</div>
              <div className="text-sm text-muted-foreground">
                Each church fully isolated
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-4xl font-bold text-primary">Invite flow</div>
              <div className="text-sm text-muted-foreground">Staff and member onboarding</div>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="text-4xl font-bold text-primary">Full audit</div>
              <div className="text-sm text-muted-foreground">Treasury and access logs</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Transform Your Church Management?
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-lg">
              Join churches already using MPG Church Systems to streamline
              their operations and focus on what matters most.
            </p>
            <Button size="lg" className="mt-4" asChild>
              <Link href="/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container px-4 md:px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Church className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">MPG Church Systems</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering churches with modern management tools.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-foreground">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MPG Church Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
