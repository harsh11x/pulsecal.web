"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { store } from "@/app/store"
import { GetStartedAction } from "@/components/landing/GetStartedAction"
import { AuthModal } from "@/components/auth/AuthModal"
import { Button } from "@/components/ui/button"
import { PLANS, PLAN_AMOUNTS, SUBSCRIPTION_DURATIONS } from "@/lib/planConfig"
import { CheckCircle2, User, Stethoscope, Users, Building2, Shield, Calendar, Video, FileText, MessageSquare, Clock, BarChart, Heart, Activity } from "lucide-react"

export default function Home() {
  const router = useRouter()
  // Auth state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [selectedRole, setSelectedRole] = useState<"doctor" | "patient" | "receptionist" | null>(null)

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Pricing state
  const [billingInterval, setBillingInterval] = useState<1 | 3 | 6 | 12>(1)

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const state = store.getState()
    if (state.auth.user) {
      router.push("/dashboard")
    }
  }, [router])

  const handleAuth = (role: "doctor" | "patient" | "receptionist") => {
    setSelectedRole(role)
    setAuthMode("signin")
    setIsAuthModalOpen(true)
  }

  return (
    <div className="bg-slate-base text-slate-800 antialiased selection:bg-medical-blue selection:text-white font-sans">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/logo.png" alt="PulseCal Logo" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-navy-deep tracking-tight">PulseCal</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a className="text-sm font-medium text-corporate-gray hover:text-medical-blue transition-colors cursor-pointer" href="#solutions">Solutions</a>
                <a className="text-sm font-medium text-corporate-gray hover:text-medical-blue transition-colors cursor-pointer" href="#features">Features</a>
                <a className="text-sm font-medium text-corporate-gray hover:text-medical-blue transition-colors cursor-pointer" href="#pricing">Pricing</a>
                <a className="text-sm font-medium text-corporate-gray hover:text-medical-blue transition-colors cursor-pointer" href="#about">About</a>
              </div>
            </div>
            <div className="hidden md:flex gap-3 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAuth("doctor")}
                className="gap-2 border-slate-200 text-slate-700 hover:text-medical-blue hover:border-medical-blue transition-all"
              >
                <Stethoscope className="h-4 w-4" />
                Doctor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAuth("patient")}
                className="gap-2 border-slate-200 text-slate-700 hover:text-medical-blue hover:border-medical-blue transition-all"
              >
                <User className="h-4 w-4" />
                Patient
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAuth("receptionist")}
                className="gap-2 border-slate-200 text-slate-700 hover:text-medical-blue hover:border-medical-blue transition-all"
              >
                <Building2 className="h-4 w-4" />
                Receptionist
              </Button>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-medical-blue focus:outline-none"
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur p-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-4">
              <a href="#solutions" className="text-sm font-medium text-slate-600 hover:text-medical-blue py-2" onClick={() => setIsMobileMenuOpen(false)}>Solutions</a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-medical-blue py-2" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-medical-blue py-2" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
              <a href="#about" className="text-sm font-medium text-slate-600 hover:text-medical-blue py-2" onClick={() => setIsMobileMenuOpen(false)}>About</a>

              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-slate-200 text-slate-700"
                  onClick={() => { handleAuth("doctor"); setIsMobileMenuOpen(false); }}
                >
                  <Stethoscope className="h-4 w-4" />
                  Doctor Login / Signup
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-slate-200 text-slate-700"
                  onClick={() => { handleAuth("patient"); setIsMobileMenuOpen(false); }}
                >
                  <User className="h-4 w-4" />
                  Patient Login / Signup
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-slate-200 text-slate-700"
                  onClick={() => { handleAuth("receptionist"); setIsMobileMenuOpen(false); }}
                >
                  <Building2 className="h-4 w-4" />
                  Receptionist Login / Signup
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 bg-white overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-medical-light opacity-50 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-slate-100 opacity-80 blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-medical-blue mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="w-1.5 h-1.5 rounded-full bg-medical-blue animate-pulse"></span>
              New: Integrated Telehealth Module
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-navy-deep mb-6 leading-[1.15] animate-in fade-in slide-in-from-bottom-6 duration-700">
              Orchestrating Care with <br />
              <span className="bg-gradient-to-r from-medical-blue to-blue-600 bg-clip-text text-transparent">Precision & Empathy.</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-corporate-gray leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              PulseCal unifies the healthcare journey. A seamless, secure operating system connecting patients, practitioners, and administrative staff in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
              <GetStartedAction
                className="bg-medical-blue hover:bg-blue-700 px-8 py-3.5 rounded-lg text-base font-medium text-white shadow-card transition-all flex items-center justify-center gap-2 h-auto"
              />
              <a className="px-8 py-3.5 rounded-lg text-base font-medium text-navy-deep bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer" href="#how-it-works">
                <span className="material-symbols-outlined text-medical-blue text-xl">play_circle</span>
                See How It Works
              </a>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-6xl mx-auto mt-8 animate-in fade-in zoom-in duration-1000">
            <div className="absolute -inset-2 bg-gradient-to-b from-blue-100/50 to-white rounded-2xl blur-lg opacity-60"></div>
            <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-block px-3 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-mono">app.pulsecal.health/dashboard</div>
                </div>
              </div>

              <div className="aspect-[16/9] w-full bg-slate-50 relative flex overflow-hidden">
                {/* Sidebar Mockup */}
                <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col pt-6 px-4 pb-6 hidden md:flex">
                  <div className="flex items-center gap-3 mb-8 px-2">
                    <img src="/logo.png" alt="PulseCal Logo" className="h-8 w-8 object-contain" />
                    <span className="font-bold text-navy-deep">PulseCal</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-medical-blue rounded-md text-sm font-medium">
                      <span className="material-symbols-outlined text-[20px]">dashboard</span>
                      Overview
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm font-medium">
                      <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                      Appointments
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm font-medium">
                      <span className="material-symbols-outlined text-[20px]">people</span>
                      Patients
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-md text-sm font-medium">
                      <span className="material-symbols-outlined text-[20px]">description</span>
                      Records
                    </div>
                  </div>
                </div>

                {/* Main Content Mockup */}
                <div className="flex-1 p-8 overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-navy-deep">Dr. Sarah Jenning</h2>
                      <p className="text-sm text-slate-500">Cardiology Dept • Today's Schedule</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">SJ</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    {/* Stat Cards */}
                    <div className="col-span-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                      <div className="text-sm text-slate-500 mb-1">Total Patients</div>
                      <div className="text-2xl font-bold text-navy-deep">1,248</div>
                      <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <span className="text-[14px]">↑</span> +12% this month
                      </div>
                    </div>
                    <div className="col-span-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                      <div className="text-sm text-slate-500 mb-1">Appointments</div>
                      <div className="text-2xl font-bold text-navy-deep">42</div>
                      <div className="text-xs text-slate-400 mt-2">8 Pending confirmation</div>
                    </div>
                    <div className="col-span-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                      <div className="text-sm text-slate-500 mb-1">Avg. Wait Time</div>
                      <div className="text-2xl font-bold text-navy-deep">14m</div>
                      <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <span className="text-[14px]">↓</span> -2m vs last week
                      </div>
                    </div>

                    {/* Schedule List */}
                    <div className="col-span-8 bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                      <h3 className="font-semibold text-navy-deep mb-4">Upcoming Consultations</h3>
                      <div className="space-y-4">
                        {[
                          { name: "James Miller", time: "09:30 AM", status: "Confirmed", type: "Routine Checkup", color: "green", initial: "JM", initialColor: "blue" },
                          { name: "Amanda Lee", time: "10:15 AM", status: "Pending", type: "Follow-up", color: "yellow", initial: "AL", initialColor: "orange" },
                          { name: "Robert King", time: "11:00 AM", status: "Virtual", type: "Video Consult", color: "blue", initial: "RK", initialColor: "purple" }
                        ].map((patient, i) => (
                          <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-md transition-colors border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full bg-${patient.initialColor}-100 flex items-center justify-center text-${patient.initialColor}-700 font-semibold text-sm`}>
                                {patient.initial}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-navy-deep">{patient.name}</div>
                                <div className="text-xs text-slate-500">{patient.type} • {patient.time}</div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 bg-${patient.color}-50 text-${patient.color}-700 text-xs font-medium rounded`}>
                              {patient.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notification/CTA Area */}
                    <div className="col-span-4 space-y-4">
                      <div className="bg-gradient-to-br from-medical-blue to-blue-600 rounded-lg p-5 text-white shadow-md">
                        <div className="flex items-start justify-between mb-4">
                          <div className="font-medium">Notifications</div>
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-white/10 rounded p-2 text-xs backdrop-blur-sm">
                            Lab results ready for <strong>Patient #8842</strong>
                          </div>
                          <div className="bg-white/10 rounded p-2 text-xs backdrop-blur-sm">
                            New referral from Dr. Chen
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <div className="border-y border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-500 mb-8">TRUSTED BY LEADING HEALTHCARE PROVIDERS</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
            {["MEDLIFE", "HEARTCARE", "MINDWELL", "DENTALLIANCE", "KIDSHOSPITAL"].map((brand) => (
              <div key={brand} className="flex items-center gap-2 text-navy-deep font-bold text-xl">
                <div className="w-6 h-6 bg-slate-300 rounded-full opacity-50"></div> {brand}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Solutions / Roles Section */}
      <section className="py-24 bg-slate-50 relative" id="solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-navy-deep mb-4">Unified Care Management</h2>
            <p className="text-corporate-gray text-lg">Designed for the complexities of modern healthcare. Three distinct experiences, one cohesive platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* For Providers */}
            <div className="bento-card bg-white border border-slate-200 rounded-2xl p-8 shadow-card flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-medical-blue mb-6">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-navy-deep mb-2">For Providers</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">Streamlined charting, AI-assisted diagnosis coding, and schedule management that respects your time.</p>
                <ul className="space-y-3 mb-6">
                  {["Real-time EHR integration", "Smart SOAP notes", "Telehealth built-in"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-green-500 text-lg mt-0.5 h-5 w-5" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* For Patients */}
            <div className="bento-card bg-white border border-slate-200 rounded-2xl p-8 shadow-card flex flex-col justify-between relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 mb-6">
                  <User className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-navy-deep mb-2">For Patients</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">Empower patients with a portal they will actually use. Easy booking, record access, and payments.</p>
                <ul className="space-y-3 mb-6">
                  {["24/7 Online Booking", "Secure Messaging", "Prescription Refills"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-green-500 text-lg mt-0.5 h-5 w-5" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* For Administration */}
            <div className="bento-card bg-white border border-slate-200 rounded-2xl p-8 shadow-card flex flex-col justify-between hover:shadow-lg transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-navy-deep mb-2">For Administration</h3>
                <p className="text-slate-500 mb-6 leading-relaxed">Operational excellence. Reduce no-shows, optimize billing, and manage staff resources effortlessly.</p>
                <ul className="space-y-3 mb-6">
                  {["Insurance Eligibility", "Automated Reminders", "Resource Analytics"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-green-500 text-lg mt-0.5 h-5 w-5" />
                      <span className="text-sm text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 bento-card bg-navy-deep rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#475569 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <h3 className="text-3xl font-bold text-white mb-4">Enterprise-Grade Security & Compliance</h3>
                <p className="text-slate-300 text-lg mb-6">Built to HIPAA, GDPR, and SOC2 standards. Your patient data is encrypted at rest and in transit.</p>
                <div className="flex flex-wrap gap-4">
                  {["HIPAA Compliant", "SOC2 Type II", "256-bit Encryption"].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white border border-white/20">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Shield className="h-32 w-32 text-medical-blue opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="border-b border-slate-200 bg-muted/20 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-navy-deep lg:text-5xl">
              Why healthcare providers choose PulseCal
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-white transition-colors">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-bounce delay-100">
                <Stethoscope className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="mb-2 text-3xl font-bold text-navy-deep">98%</h3>
              <p className="text-lg font-medium text-navy-deep">Patient Satisfaction</p>
              <p className="mt-2 text-slate-500">Patients love the convenience</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-white transition-colors">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 animate-bounce delay-200">
                <Clock className="h-10 w-10 text-medical-blue" />
              </div>
              <h3 className="mb-2 text-3xl font-bold text-navy-deep">5 hours</h3>
              <p className="text-lg font-medium text-navy-deep">Saved per day</p>
              <p className="mt-2 text-slate-500">Automated workflows free up staff</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-white transition-colors">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 animate-bounce delay-300">
                <Activity className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="mb-2 text-3xl font-bold text-navy-deep">40%</h3>
              <p className="text-lg font-medium text-navy-deep">Revenue Increase</p>
              <p className="mt-2 text-slate-500">Reduced no-shows and better scheduling</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Re-integrated) */}
      <section id="pricing" className="border-b border-slate-200 bg-slate-base px-4 py-20 relative">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-navy-deep lg:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-xl text-corporate-gray leading-relaxed mb-8">
              Choose the plan that fits your practice.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-white p-1.5 rounded-full w-fit mx-auto border border-slate-200 shadow-sm">
              {SUBSCRIPTION_DURATIONS.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setBillingInterval(duration.value)}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billingInterval === duration.value
                    ? "bg-medical-blue text-white shadow-sm"
                    : "text-slate-500 hover:text-navy-deep"
                    }`}
                >
                  {duration.label}
                  {duration.discount > 0 && (
                    <span className={`absolute -top-2 -right-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full border border-green-200 font-bold ${billingInterval === duration.value ? "opacity-100" : "opacity-0"
                      }`}>
                      -{duration.discount}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan, index) => {
              const baseAmount = PLAN_AMOUNTS[plan.id]
              let multiplier: number = billingInterval
              if (billingInterval === 12) multiplier = 10 // pay for 10 get 12

              const totalAmount = baseAmount * multiplier
              const priceDisplay = `Rs. ${totalAmount.toLocaleString("en-IN")}`

              // Calculate savings
              let savings = null
              if (billingInterval > 1) {
                const regularPrice = baseAmount * billingInterval
                const savedAmount = regularPrice - totalAmount
                if (savedAmount > 0) {
                  savings = `Save ₹${savedAmount.toLocaleString("en-IN")}`
                }
              }

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-8 transition-all duration-300 bg-white ${plan.recommended
                    ? "border-medical-blue shadow-xl scale-105 z-10"
                    : "border-slate-200 hover:border-medical-blue/50 hover:shadow-lg hover:-translate-y-1"
                    }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-medical-blue px-4 py-1 text-xs font-semibold text-white shadow-md">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {billingInterval > 1 && (
                    <div className="absolute top-4 right-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
                        {billingInterval === 12 ? "12 Months Autopay" : `${billingInterval} Months`}
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="mb-2 text-2xl font-bold text-navy-deep">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.description}</p>
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-navy-deep">{priceDisplay}</span>
                    <span className="text-slate-500"> / {SUBSCRIPTION_DURATIONS.find(d => d.value === billingInterval)?.label.toLowerCase().replace("months", "mo") || "month"}</span>
                  </div>
                  {savings && (
                    <div className="mb-6 text-sm text-green-600 font-semibold animate-pulse">
                      {savings}
                    </div>
                  )}
                  {!savings && <div className="mb-6 h-5"></div>}

                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <GetStartedAction
                    className={`w-full ${plan.recommended ? "bg-medical-blue hover:bg-blue-700 text-white" : "border-2 border-medical-blue text-medical-blue hover:bg-blue-50 bg-transparent"}`}
                    variant={plan.recommended ? "default" : "outline"}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-balance text-4xl font-bold tracking-tight text-navy-deep lg:text-5xl">
            Modernize your practice today.
          </h2>
          <p className="mb-8 text-pretty text-xl text-corporate-gray leading-relaxed">
            Join over 850 healthcare organizations delivering better outcomes with PulseCal.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <GetStartedAction
              className="bg-medical-blue hover:bg-blue-700 px-8 py-3.5 rounded-lg font-bold text-white shadow-card transition-colors h-auto text-lg"
            />
          </div>
          <p className="mt-6 text-sm text-slate-500">No credit card required. 14-day free trial for qualifying practices.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 pt-16 pb-8" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="PulseCal Logo" className="h-6 w-6 object-contain" />
                <span className="text-lg font-bold text-navy-deep">PulseCal</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
                The complete operating system for modern healthcare providers. Streamlining operations so you can focus on care.
              </p>
            </div>
            <div>
              <h4 className="text-navy-deep font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a className="hover:text-medical-blue transition-colors" href="#features">Scheduling</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#features">Telehealth</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#features">EHR Integration</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#solutions">Patient Portal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-navy-deep font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a className="hover:text-medical-blue transition-colors" href="#">Case Studies</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#">Help Center</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#">Webinars</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-navy-deep font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a className="hover:text-medical-blue transition-colors" href="#">About Us</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#">Careers</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#">Contact</a></li>
                <li><a className="hover:text-medical-blue transition-colors" href="#">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">© 2024 PulseCal Inc. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-slate-500">
              <a className="hover:text-navy-deep" href="#">Privacy Policy</a>
              <a className="hover:text-navy-deep" href="#">Terms of Service</a>
              <a className="hover:text-navy-deep" href="#">BAA Agreement</a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authMode}
        selectedRole={selectedRole}
      />
    </div>
  )
}
