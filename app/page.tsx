"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { store } from "@/app/store"
import { GetStartedAction } from "@/components/landing/GetStartedAction"
import { AuthModal } from "@/components/auth/AuthModal"
import { Button } from "@/components/ui/button"
import { PLANS, PLAN_AMOUNTS, SUBSCRIPTION_DURATIONS } from "@/lib/planConfig"
import { CheckCircle2, User, Stethoscope, Users, Building2, Shield, Calendar, Video, FileText, MessageSquare, Clock, BarChart, Heart, Activity, Instagram, Linkedin } from "lucide-react"

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
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 bg-slate-base overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] rounded-full bg-medical-light opacity-50 blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] rounded-full bg-blue-100 opacity-60 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-50 opacity-40 blur-3xl animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 backdrop-blur-sm border border-blue-100 text-xs font-semibold text-medical-blue mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm hover:shadow-md transition-all cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-medical-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-medical-blue"></span>
              </span>
              New: Integrated Telehealth Module
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-navy-deep mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 text-balance">
              Simple, Connected <br />
              <span className="text-gradient">Healthcare for Everyone.</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-corporate-gray leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 text-balance">
              PulseCal connects patients, doctors, and staff in one easy-to-use platform. Manage appointments, records, and billing with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
              <GetStartedAction
                className="bg-medical-blue hover:bg-blue-700 hover:scale-105 active:scale-95 px-8 py-4 rounded-xl text-base font-bold text-white shadow-lg shadow-medical-blue/25 transition-all flex items-center justify-center gap-2 h-auto"
              />
              <a className="px-8 py-4 rounded-xl text-base font-bold text-navy-deep bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group" href="#how-it-works">
                <span className="material-symbols-outlined text-medical-blue text-xl group-hover:scale-110 transition-transform">play_circle</span>
                See How It Works
              </a>
            </div>
          </div>

          {/* Dashboard Preview - 3D Floating Effect */}
          <div className="relative max-w-6xl mx-auto mt-8 animate-in fade-in zoom-in duration-1000 perspective-1000">
            {/* Glow behind */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-medical-blue/20 to-purple-500/20 rounded-[2rem] blur-2xl opacity-70 animate-pulse-slow"></div>

            <div className="relative bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 transform-style-3d animate-float hover:rotate-x-2 transition-transform duration-500">
              <div className="h-10 bg-white/80 border-b border-slate-200/60 flex items-center px-4 gap-2 backdrop-blur-md">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex-1 text-center">
                  <div className="inline-block px-3 py-1 bg-slate-50/50 border border-slate-200/50 rounded text-[10px] text-slate-400 font-mono">app.pulsecal.health/dashboard</div>
                </div>
              </div>

              <div className="aspect-[16/9] w-full bg-slate-50/50 relative flex overflow-hidden">
                {/* Sidebar Mockup */}
                <div className="w-64 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 flex-shrink-0 flex flex-col pt-6 px-4 pb-6 hidden md:flex z-10">
                  <div className="flex items-center gap-3 mb-8 px-2">
                    <img src="/logo.png" alt="PulseCal Logo" className="h-8 w-8 object-contain" />
                    <span className="font-bold text-navy-deep text-lg">PulseCal</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50/80 text-medical-blue rounded-lg text-sm font-semibold shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">dashboard</span>
                      Overview
                    </div>
                    {["Appointments", "Patients", "Records", "Settings"].map((item, i) => (
                      <div key={item} className="flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">{["calendar_month", "people", "description", "settings"][i]}</span>
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                      <div className="text-xs font-semibold text-indigo-900 mb-1">Pro Plan</div>
                      <div className="text-[10px] text-indigo-700/80 mb-2">Your team is growing fast!</div>
                      <button className="text-[10px] bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-100 w-full font-medium hover:bg-indigo-50 transition-colors">Upgrade</button>
                    </div>
                  </div>
                </div>

                {/* Main Content Mockup */}
                <div className="flex-1 p-8 overflow-hidden relative">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-navy-deep">Dr. Sarah Jenning</h2>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Cardiology Dept • Today's Schedule
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                      </button>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white">SJ</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    {/* Stat Cards */}
                    {[
                      { label: "Total Patients", val: "1,248", change: "+12%", trend: "up", color: "green" },
                      { label: "Today's Appts", val: "42", change: "8 Pending", trend: "neutral", color: "blue" },
                      { label: "Avg. Wait Time", val: "14m", change: "-2m", trend: "down", color: "green" }
                    ].map((stat, i) => (
                      <div key={i} className="col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="text-sm text-slate-500 mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-navy-deep group-hover:text-medical-blue transition-colors">{stat.val}</div>
                        <div className={`text-xs mt-2 flex items-center gap-1 ${stat.trend === 'down' || stat.trend === 'up' ? 'text-green-600' : 'text-slate-400'}`}>
                          {stat.trend === 'up' && "↑"} {stat.trend === 'down' && "↓"} {stat.change}
                        </div>
                      </div>
                    ))}

                    {/* Schedule List */}
                    <div className="col-span-8 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Calendar className="w-24 h-24" />
                      </div>
                      <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
                        Upcoming Consultations
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">Today</span>
                      </h3>
                      <div className="space-y-3">
                        {[
                          { name: "James Miller", time: "09:30 AM", status: "Confirmed", type: "Routine Checkup", color: "green", initial: "JM", initialColor: "blue" },
                          { name: "Amanda Lee", time: "10:15 AM", status: "Pending", type: "Follow-up", color: "yellow", initial: "AL", initialColor: "orange" },
                          { name: "Robert King", time: "11:00 AM", status: "Virtual", type: "Video Consult", color: "blue", initial: "RK", initialColor: "purple" }
                        ].map((patient, i) => (
                          <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50/80 rounded-xl transition-all border border-transparent hover:border-slate-100 cursor-pointer group">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full bg-${patient.initialColor}-50 flex items-center justify-center text-${patient.initialColor}-600 font-bold text-sm ring-2 ring-white shadow-sm group-hover:scale-110 transition-transform`}>
                                {patient.initial}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-navy-deep group-hover:text-medical-blue transition-colors">{patient.name}</div>
                                <div className="text-xs text-slate-500">{patient.type} • {patient.time}</div>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 bg-${patient.color}-50 text-${patient.color}-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-${patient.color}-100`}>
                              {patient.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notification/CTA Area */}
                    <div className="col-span-4 space-y-4">
                      <div className="bg-gradient-to-br from-medical-blue to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className="font-bold flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Activity
                          </div>
                          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                        </div>
                        <div className="space-y-3 relative z-10">
                          <div className="bg-white/10 rounded-lg p-3 text-xs backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                            Lab results ready for <strong>Patient #8842</strong>
                            <div className="text-[10px] text-blue-100 mt-1">2 mins ago</div>
                          </div>
                          <div className="bg-white/10 rounded-lg p-3 text-xs backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                            New referral from Dr. Chen
                            <div className="text-[10px] text-blue-100 mt-1">1 hour ago</div>
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

      {/* Trusted By Section - Marquee */}
      <div className="border-y border-slate-200 bg-white py-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <p className="text-center text-xs font-bold tracking-widest text-slate-400 uppercase">Trusted by leading healthcare providers</p>
        </div>

        <div className="relative flex overflow-x-hidden group">
          <div className="flex animate-marquee whitespace-nowrap pause-on-hover">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-16 md:gap-24 mx-8 md:mx-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                {["MEDLIFE", "HEARTCARE", "MINDWELL", "DENTALLIANCE", "KIDSHOSPITAL", "PHYSIOPLUS", "DERMACLINIC"].map((brand) => (
                  <div key={`${i}-${brand}`} className="flex items-center gap-2 text-navy-deep font-bold text-xl hover:text-medical-blue hover:scale-105 transition-all cursor-default">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">
                      {brand[0]}
                    </div>
                    {brand}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Fade edges */}
          <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10"></div>
        </div>
      </div>

      {/* Solutions / Roles Section */}
      <section className="py-24 bg-slate-base relative overflow-hidden" id="solutions">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-navy-deep mb-4 tracking-tight">All Your Needs in One Place</h2>
            <p className="text-corporate-gray text-lg md:text-xl">Everything you need to manage healthcare, whether you are a doctor, a patient, or front desk staff.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Providers */}
            <div className="glass-card rounded-2xl p-8 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-medical-blue mb-8 group-hover:scale-110 group-hover:bg-medical-blue group-hover:text-white transition-all duration-300">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-navy-deep mb-3">For Providers</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">Streamlined charting, AI-assisted diagnosis coding, and schedule management that respects your time.</p>
                <ul className="space-y-4 mb-6">
                  {["Real-time EHR integration", "Smart SOAP notes", "Telehealth built-in"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                        <CheckCircle2 className="text-green-600 text-xs w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* For Patients */}
            <div className="glass-card rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group border-medical-blue/20 ring-1 ring-medical-blue/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-50 to-green-100 rounded-bl-full -mr-10 -mt-10 z-0 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mb-8 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                  <User className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-navy-deep mb-3">For Patients</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">Empower patients with a portal they will actually use. Easy booking, record access, and payments.</p>
                <ul className="space-y-4 mb-6">
                  {["24/7 Online Booking", "Secure Messaging", "Prescription Refills"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                        <CheckCircle2 className="text-green-600 text-xs w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* For Administration */}
            <div className="glass-card rounded-2xl p-8 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-8 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-navy-deep mb-3">For Administration</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">Operational excellence. Reduce no-shows, optimize billing, and manage staff resources effortlessly.</p>
                <ul className="space-y-4 mb-6">
                  {["Insurance Eligibility", "Automated Reminders", "Resource Analytics"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                        <CheckCircle2 className="text-green-600 text-xs w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            {/* Dark gradient background */}
            <div className="absolute inset-0 bg-navy-deep"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-medical-blue/30 to-purple-600/30 opacity-50"></div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-medical-blue/30 rounded-full blur-3xl animate-pulse-slow"></div>

            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold tracking-wide text-xs uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Security First
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Safe, Secure, and Private</h3>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">Your data is safe with us. We use top-tier security to keep your information private and protected.</p>
                <div className="flex flex-wrap gap-3">
                  {["HIPAA Compliant", "SOC2 Type II", "256-bit Encryption", "GDPR Ready", "Audit Logs"].map(tag => (
                    <span key={tag} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm text-white border border-white/10 backdrop-blur-sm transition-colors cursor-default">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-medical-blue/50 blur-2xl rounded-full"></div>
                <Shield className="relative h-40 w-40 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transform group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="border-b border-slate-200 bg-white px-4 py-24 relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[500px] bg-slate-50 skew-y-3 z-0"></div>

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-navy-deep lg:text-5xl">
              Why Choose <span className="text-medical-blue">PulseCal?</span>
            </h2>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
            {[
              { icon: Stethoscope, val: "98%", label: "Patient Satisfaction", desc: "Patients love the convenience", color: "green" },
              { icon: Clock, val: "5 hrs", label: "Saved Weekly", desc: "Automated workflows free up staff", color: "blue" },
              { icon: Activity, val: "40%", label: "Revenue Increase", desc: "Reduced no-shows and better scheduling", color: "purple" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-${stat.color}-50 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-10 w-10 text-${stat.color}-600`} />
                </div>
                <h3 className="mb-2 text-5xl font-bold text-navy-deep tracking-tight">{stat.val}</h3>
                <p className="text-xl font-bold text-navy-deep mb-2">{stat.label}</p>
                <p className="text-slate-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Re-integrated) */}
      <section id="pricing" className="border-b border-slate-200 bg-slate-base px-4 py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white opacity-50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-navy-deep lg:text-6xl">
              Fair and Simple Pricing
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-xl text-corporate-gray leading-relaxed mb-10">
              Choose the plan that fits your practice. No hidden fees.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-white/80 backdrop-blur-sm p-1.5 rounded-full w-fit mx-auto border border-slate-200 shadow-lg">
              {SUBSCRIPTION_DURATIONS.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setBillingInterval(duration.value)}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${billingInterval === duration.value
                    ? "bg-medical-blue text-white shadow-md transform scale-105"
                    : "text-slate-500 hover:text-navy-deep hover:bg-slate-100"
                    }`}
                >
                  {duration.label}
                  {duration.discount > 0 && (
                    <span className={`absolute -top-3 -right-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm font-bold animate-bounce ${billingInterval === duration.value ? "opacity-100" : "opacity-0"
                      }`}>
                      SAVE {duration.discount}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
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
                  className={`relative rounded-3xl p-8 transition-all duration-500 flex flex-col ${plan.recommended
                    ? "glass-card border-medical-blue/30 shadow-2xl scale-110 z-10"
                    : "bg-white border border-slate-200 hover:border-medical-blue/30 hover:shadow-xl hover:-translate-y-2"
                    }`}
                >
                  {plan.recommended && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-medical-blue to-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg flex items-center gap-2">
                        <Heart className="w-4 h-4 fill-current" /> Most Popular
                      </span>
                    </div>
                  )}
                  {billingInterval > 1 && (
                    <div className="absolute top-6 right-6">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
                        {billingInterval === 12 ? "12 Months" : `${billingInterval} Months`}
                      </span>
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="mb-3 text-2xl font-bold text-navy-deep">{plan.name}</h3>
                    <p className="text-sm text-slate-500 leading-snug">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-navy-deep tracking-tight">{priceDisplay}</span>
                      <span className="text-slate-500 font-medium text-sm">/ {SUBSCRIPTION_DURATIONS.find(d => d.value === billingInterval)?.label.toLowerCase().replace("months", "mo") || "month"}</span>
                    </div>
                    {savings ? (
                      <div className="text-sm text-green-600 font-bold mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        {savings}
                      </div>
                    ) : (
                      <div className="h-7"></div>
                    )}
                  </div>

                  <ul className="mb-8 space-y-4 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${plan.recommended ? 'text-medical-blue' : 'text-slate-400'}`} />
                        <span className="text-sm text-slate-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <GetStartedAction
                    className={`w-full py-6 rounded-xl text-base font-bold transition-all ${plan.recommended ? "bg-medical-blue hover:bg-blue-700 text-white shadow-lg hover:shadow-medical-blue/30" : "border-2 border-slate-200 text-slate-700 hover:border-medical-blue hover:text-medical-blue bg-transparent"}`}
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
            Get Started Today.
          </h2>
          <p className="mb-8 text-pretty text-xl text-corporate-gray leading-relaxed">
            Join hundreds of healthcare providers helping patients every day.
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
              <div className="flex gap-4 mt-6">
                <a href="https://www.instagram.com/pulsecalofficial?igsh=MWVyZG5xMjJybnVhZw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md hover:scale-110 transition-all text-pink-600">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/company/pulsecal" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full shadow-sm hover:shadow-md hover:scale-110 transition-all text-blue-700">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
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
