import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { RoleCard } from "@/components/marketing/RoleCard";
import { WorkflowStep } from "@/components/marketing/WorkflowStep";
import {
  Users,
  Building2,
  CalendarCheck,
  Wallet,
  Calendar,
  BarChart3,
  ArrowRight,
  Shield,
  UserCog,
  User,
  Landmark,
  CheckCircle2,
  Globe,
  Lock,
  FileText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MPG Church — Complete Church Management Platform",
  description:
    "A complete church management platform for modern ministries. Members, staff, treasury, and events in one secure workspace.",
};

const features = [
  {
    icon: Users,
    title: "Member Management",
    description:
      "Comprehensive member directory with profiles, households, status tracking, and full history.",
  },
  {
    icon: Building2,
    title: "Departments & Teams",
    description:
      "Organize your church into departments with role assignments and leadership structures.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance Tracking",
    description:
      "Track attendance for services, events, and small groups with detailed reports.",
  },
  {
    icon: Wallet,
    title: "Treasury & Finance",
    description:
      "Manage income, expenses, funds, and generate financial reports with full audit trails.",
  },
  {
    icon: Calendar,
    title: "Events & Calendar",
    description:
      "Plan and manage church events with scheduling, coordination, and department integration.",
  },
  {
    icon: BarChart3,
    title: "Reports & Insights",
    description:
      "Get valuable insights with detailed analytics on membership, attendance, and finances.",
  },
];

const roles = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Church Admin / Pastor",
    description: "Lead with clarity and confidence",
    features: [
      "Complete oversight of church operations",
      "Manage staff roles and permissions",
      "Review approvals and leadership requests",
      "Access full reports and analytics",
    ],
  },
  {
    icon: <UserCog className="h-5 w-5" />,
    title: "Clerk / Secretary",
    description: "Keep member records organized",
    features: [
      "Maintain accurate member directory",
      "Track membership status changes",
      "Manage household relationships",
      "Handle member transfers and history",
    ],
  },
  {
    icon: <Landmark className="h-5 w-5" />,
    title: "Treasurer",
    description: "Financial accountability made simple",
    features: [
      "Record tithes, offerings, and donations",
      "Track expenses and manage funds",
      "Generate financial reports",
      "Full audit trail for accountability",
    ],
  },
  {
    icon: <User className="h-5 w-5" />,
    title: "Member",
    description: "Stay connected with your church",
    features: [
      "View and update your profile",
      "See church announcements",
      "Access department information",
      "Participate in church life",
    ],
  },
];

const workflowSteps = [
  {
    title: "Create your church workspace",
    description:
      "Set up your church in minutes with a custom link name. You become the church admin with full operational access.",
  },
  {
    title: "Invite your staff team",
    description:
      "Send secure invites to pastors, clerks, and treasurers. Each gets appropriate role-based access to the workspace.",
  },
  {
    title: "Add and invite members",
    description:
      "Build your member directory. Send secure onboarding invites so members can claim their profiles and access the portal.",
  },
  {
    title: "Organize and operate",
    description:
      "Create departments, plan events, track attendance, and manage treasury—all in one unified workspace.",
  },
];

const trustAttributes = [
  { icon: Globe, label: "English & French", sublabel: "Bilingual support" },
  { icon: Lock, label: "Multi-tenant", sublabel: "Fully isolated data" },
  { icon: Shield, label: "Invite-based", sublabel: "Secure onboarding" },
  { icon: FileText, label: "Full audit", sublabel: "Treasury & access logs" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 py-24 lg:py-32">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent" />
        </div>

        <div className="container relative px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-blue-100">
              <span className="mr-2 flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Now available for churches worldwide
            </div>

            {/* Headline */}
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Everything your church{" "}
              <span className="text-cyan-300">needs</span>, organized
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl text-lg text-blue-100/80 md:text-xl">
              Members, staff, treasury, events, and reporting—unified in one secure workspace. 
              Built for real church administration workflows.
            </p>

            {/* CTAs */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                <Link href="/register">
                  Start your church workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="#features">Explore features</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-blue-100/70">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Built for SDA churches</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Invite-based security</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>Full audit trails</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustAttributes.map((attr) => (
              <div
                key={attr.label}
                className="flex items-center gap-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 text-white">
                  <attr.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{attr.label}</div>
                  <div className="text-sm text-slate-500">{attr.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Everything you need to run your church
            </h2>
            <p className="max-w-2xl text-lg text-slate-500">
              Powerful tools designed specifically for church administration—no generic business software workarounds needed.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 mb-5">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based Value Section */}
      <section id="roles" className="border-y border-slate-200 bg-slate-50 py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Designed for every role
            </h2>
            <p className="max-w-2xl text-lg text-slate-500">
              Whether you lead the church, keep the records, manage finances, or participate as a member—there&apos;s a place for you.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <RoleCard
                key={role.title}
                icon={role.icon}
                title={role.title}
                description={role.description}
                features={role.features}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
                How it works
              </h2>
              <p className="text-lg text-slate-500 mb-8">
                Get your church workspace up and running in minutes. Invite your team, add your members, and start operating with clarity.
              </p>

              <div className="space-y-0">
                {workflowSteps.map((step, index) => (
                  <WorkflowStep
                    key={step.title}
                    number={index + 1}
                    title={step.title}
                    description={step.description}
                    isLast={index === workflowSteps.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Value Proposition Card */}
            <div className="relative">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 mb-6">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Secure by design
                </h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  Your church data is isolated and protected. Role-based access ensures staff see what they need, members see their own profiles, and everything is tracked.
                </p>
                <ul className="space-y-3">
                  {[
                    "Multi-tenant architecture—each church is isolated",
                    "Role-based access control for staff and members",
                    "Secure invite-based onboarding (no open registration)",
                    "Full audit trails for treasury and access",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Value Section */}
      <section className="border-y border-slate-200 bg-slate-50 py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
              Built for church administration
            </h2>
            <p className="text-lg text-slate-500 mb-10">
              Not a generic CRM adapted for churches. Not a spreadsheet workaround. 
              A purpose-built platform for the real workflows churches use every day.
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">Organized</div>
                <p className="text-sm text-slate-500">
                  Member records, departments, events, and finances—all in their proper place.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">Accountable</div>
                <p className="text-sm text-slate-500">
                  Full audit trails for financial records and access decisions.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">Accessible</div>
                <p className="text-sm text-slate-500">
                  Staff workspace for operations, member portal for participation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 px-6 py-16 md:px-16 md:py-24 text-center">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-cyan-400/30 via-transparent to-transparent" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl mb-6">
                Ready to organize your church?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-blue-100/80 mb-10">
                Create your church workspace today. It takes minutes to set up, and you&apos;ll have a complete platform for managing your ministry.
              </p>
              <Button
                size="lg"
                asChild
                className="bg-white text-slate-950 hover:bg-slate-100"
              >
                <Link href="/register">
                  Start your church workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-blue-100/60">
                Free to get started. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
