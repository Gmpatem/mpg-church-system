"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { RoleCard } from "@/components/marketing/RoleCard";
import { WorkflowStep } from "@/components/marketing/WorkflowStep";
import { useI18n } from "@/features/i18n";
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

export default function LandingPageClient() {
  const { t, language } = useI18n();

  // Determine if French
  const isFr = language === "fr";

  // Features data using translations
  const features = [
    {
      icon: Users,
      title: t.landing.membershipFeature,
      description: t.landing.membershipDesc,
    },
    {
      icon: Building2,
      title: t.landing.departmentsFeature,
      description: t.landing.departmentsDesc,
    },
    {
      icon: CalendarCheck,
      title: t.landing.attendanceFeature,
      description: t.landing.attendanceDesc,
    },
    {
      icon: Wallet,
      title: t.landing.treasuryFeature,
      description: t.landing.treasuryDesc,
    },
    {
      icon: Calendar,
      title: t.landing.eventsFeature,
      description: t.landing.eventsDesc,
    },
    {
      icon: BarChart3,
      title: t.landing.reportsFeature,
      description: t.landing.reportsDesc,
    },
  ];

  // Roles data
  const roles = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: isFr ? "Admin / Pasteur" : "Church Admin / Pastor",
      description: isFr ? "Dirigez avec clarté" : "Lead with clarity",
      features: isFr ? [
        "Supervision complète des opérations",
        "Gérez les rôles et permissions",
        "Révisez les approbations",
        "Accédez aux rapports complets",
      ] : [
        "Complete oversight of operations",
        "Manage staff roles and permissions",
        "Review approvals and requests",
        "Access full reports and analytics",
      ],
    },
    {
      icon: <UserCog className="h-5 w-5" />,
      title: isFr ? "Secrétaire" : "Clerk / Secretary",
      description: isFr ? "Gardez les dossiers organisés" : "Keep records organized",
      features: isFr ? [
        "Maintenez l'annuaire à jour",
        "Suivez les changements de statut",
        "Gérez les foyers",
        "Gérez les transferts",
      ] : [
        "Maintain accurate member directory",
        "Track membership status changes",
        "Manage household relationships",
        "Handle member transfers",
      ],
    },
    {
      icon: <Landmark className="h-5 w-5" />,
      title: isFr ? "Trésorier" : "Treasurer",
      description: isFr ? "Rendre compte facilement" : "Accountability made simple",
      features: isFr ? [
        "Enregistrez dîmes et dons",
        "Suivez les dépenses",
        "Générez des rapports",
        "Piste d'audit complète",
      ] : [
        "Record tithes and donations",
        "Track expenses and funds",
        "Generate financial reports",
        "Full audit trail",
      ],
    },
    {
      icon: <User className="h-5 w-5" />,
      title: isFr ? "Membre" : "Member",
      description: isFr ? "Restez connecté" : "Stay connected",
      features: isFr ? [
        "Consultez votre profil",
        "Voir les annonces",
        "Accédez aux départements",
        "Participez à la vie de l'église",
      ] : [
        "View your profile",
        "See announcements",
        "Access department info",
        "Participate in church life",
      ],
    },
  ];

  // Workflow steps
  const workflowSteps = isFr ? [
    {
      title: "Créez votre espace",
      description: "Configurez votre église en minutes. Vous devenez l'administrateur avec un accès opérationnel complet.",
    },
    {
      title: "Invitez votre équipe",
      description: "Envoyez des invitations sécurisées aux pasteurs, secrétaires et trésoriers. Chacun reçoit l'accès approprié.",
    },
    {
      title: "Ajoutez les membres",
      description: "Construisez votre annuaire. Envoyez des invitations pour que les membres puissent réclamer leurs profils.",
    },
    {
      title: "Organisez et opérez",
      description: "Créez des départements, planifiez des événements, suivez la présence et gérez la trésorerie.",
    },
  ] : [
    {
      title: "Create your workspace",
      description: "Set up your church in minutes. You become the admin with full operational access.",
    },
    {
      title: "Invite your staff team",
      description: "Send secure invites to pastors, clerks, and treasurers. Each gets appropriate role-based access.",
    },
    {
      title: "Add and invite members",
      description: "Build your member directory. Send secure invites so members can claim their profiles.",
    },
    {
      title: "Organize and operate",
      description: "Create departments, plan events, track attendance, and manage treasury—all in one workspace.",
    },
  ];

  // Trust attributes
  const trustAttributes = [
    { 
      icon: Globe, 
      label: isFr ? "EN + FR" : "EN + FR", 
      sublabel: isFr ? "Support bilingue" : "Bilingual support" 
    },
    { 
      icon: Lock, 
      label: isFr ? "Multi-locataire" : "Multi-tenant", 
      sublabel: isFr ? "Données isolées" : "Fully isolated" 
    },
    { 
      icon: Shield, 
      label: isFr ? "Invitation" : "Invite flow", 
      sublabel: isFr ? "Intégration sécurisée" : "Secure onboarding" 
    },
    { 
      icon: FileText, 
      label: isFr ? "Audit complet" : "Full audit", 
      sublabel: isFr ? "Logs et trésorerie" : "Treasury & access logs" 
    },
  ];

  // Section labels
  const labels = {
    heroEyebrow: isFr ? "Maintenant disponible pour les églises du monde" : "Now available for churches worldwide",
    heroTitle1: isFr ? "Tout ce dont votre église" : "Everything your church",
    heroTitle2: isFr ? "a besoin" : "needs",
    heroTitle3: isFr ? ", organisé" : ", organized",
    heroSubtitle: isFr 
      ? "Membres, personnel, trésorerie, événements et rapports—unifiés dans un espace sécurisé. Conçu pour les flux de travail réels d'administration d'église."
      : "Members, staff, treasury, events, and reporting—unified in one secure workspace. Built for real church administration workflows.",
    getStarted: isFr ? "Démarrer votre espace" : "Start your church workspace",
    explore: isFr ? "Explorer" : "Explore features",
    trust1: isFr ? "Conçu pour les églises ASD" : "Built for SDA churches",
    trust2: isFr ? "Sécurité par invitation" : "Invite-based security",
    trust3: isFr ? "Pistes d'audit complètes" : "Full audit trails",
    featuresTitle: isFr ? "Tout ce dont vous avez besoin" : "Everything you need",
    featuresSubtitle: isFr 
      ? "Des outils puissants conçus spécifiquement pour l'administration d'église."
      : "Powerful tools designed specifically for church administration.",
    rolesTitle: isFr ? "Conçu pour chaque rôle" : "Designed for every role",
    rolesSubtitle: isFr 
      ? "Que vous dirigiez l'église, gardiez les dossiers, gériez les finances ou participiez en tant que membre."
      : "Whether you lead the church, keep records, manage finances, or participate as a member.",
    workflowTitle: isFr ? "Comment ça marche" : "How it works",
    workflowSubtitle: isFr 
      ? "Mettez votre espace en place en minutes. Invitez votre équipe, ajoutez vos membres et commencez."
      : "Get your workspace up and running in minutes. Invite your team, add your members, and start operating.",
    secureTitle: isFr ? "Sécurisé par conception" : "Secure by design",
    secureText: isFr 
      ? "Les données de votre église sont isolées et protégées. L'accès basé sur les rôles garantit que le personnel voit ce dont il a besoin."
      : "Your church data is isolated and protected. Role-based access ensures staff see what they need.",
    valueTitle: isFr ? "Conçu pour l'administration d'église" : "Built for church administration",
    valueSubtitle: isFr 
      ? "Pas un CRM générique adapté. Pas de contournement de feuille de calcul. Une plateforme construite pour les flux de travail réels."
      : "Not a generic CRM. Not spreadsheet workarounds. A purpose-built platform for real church workflows.",
    organized: isFr ? "Organisé" : "Organized",
    organizedDesc: isFr 
      ? "Dossiers membres, départements, événements, finances—tout à sa place."
      : "Member records, departments, events, finances—all in their proper place.",
    accountable: isFr ? "Rendre compte" : "Accountable",
    accountableDesc: isFr 
      ? "Pistes d'audit complètes pour les dossiers financiers."
      : "Full audit trails for financial records and access decisions.",
    accessible: isFr ? "Accessible" : "Accessible",
    accessibleDesc: isFr 
      ? "Espace de travail pour les opérations, portail membre pour la participation."
      : "Staff workspace for operations, member portal for participation.",
    ctaTitle: isFr ? "Prêt à organiser votre église ?" : "Ready to organize your church?",
    ctaSubtitle: isFr 
      ? "Créez votre espace aujourd'hui. Cela prend des minutes à configurer."
      : "Create your church workspace today. It takes minutes to set up.",
    ctaFree: isFr ? "Gratuit pour commencer." : "Free to get started.",
  };

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 py-24 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent" />
        </div>

        <div className="container relative px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-blue-100">
              <span className="mr-2 flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              {labels.heroEyebrow}
            </div>

            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              {labels.heroTitle1}{" "}
              <span className="text-cyan-300">{labels.heroTitle2}</span>
              {labels.heroTitle3}
            </h1>

            <p className="max-w-2xl text-lg text-blue-100/80 md:text-xl">
              {labels.heroSubtitle}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/register">
                  {labels.getStarted}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href="#features">{labels.explore}</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-blue-100/70">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>{labels.trust1}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>{labels.trust2}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>{labels.trust3}</span>
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
              <div key={attr.label} className="flex items-center gap-4">
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
              {labels.featuresTitle}
            </h2>
            <p className="max-w-2xl text-lg text-slate-500">
              {labels.featuresSubtitle}
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
              {labels.rolesTitle}
            </h2>
            <p className="max-w-2xl text-lg text-slate-500">
              {labels.rolesSubtitle}
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
                {labels.workflowTitle}
              </h2>
              <p className="text-lg text-slate-500 mb-8">
                {labels.workflowSubtitle}
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
                  {labels.secureTitle}
                </h3>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  {labels.secureText}
                </p>
                <ul className="space-y-3">
                  {(isFr ? [
                    "Architecture multi-locataire—isolée",
                    "Contrôle d'accès basé sur les rôles",
                    "Intégration sécurisée par invitation",
                    "Pistes d'audit complètes",
                  ] : [
                    "Multi-tenant architecture—isolated",
                    "Role-based access control",
                    "Secure invite-based onboarding",
                    "Full audit trails",
                  ]).map((item, i) => (
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
              {labels.valueTitle}
            </h2>
            <p className="text-lg text-slate-500 mb-10">
              {labels.valueSubtitle}
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">{labels.organized}</div>
                <p className="text-sm text-slate-500">{labels.organizedDesc}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">{labels.accountable}</div>
                <p className="text-sm text-slate-500">{labels.accountableDesc}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-3xl font-bold text-slate-900 mb-2">{labels.accessible}</div>
                <p className="text-sm text-slate-500">{labels.accessibleDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 px-6 py-16 md:px-16 md:py-24 text-center">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-cyan-400/30 via-transparent to-transparent" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl mb-6">
                {labels.ctaTitle}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-blue-100/80 mb-10">
                {labels.ctaSubtitle}
              </p>
              <Button size="lg" asChild className="bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/register">
                  {labels.getStarted}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-blue-100/60">
                {labels.ctaFree}
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
