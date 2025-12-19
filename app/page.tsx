"use client"

import { Header } from "@/components/landing/Header"
import { Footer } from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Video,
  FileText,
  MessageSquare,
  Clock,
  Shield,
  Users,
  BarChart,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Heart,
  Activity,
} from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-background to-muted/20 px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground w-fit">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Trusted by 500+ healthcare providers
              </div>

              <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
                Healthcare management that <span className="text-primary">just works</span>
              </h1>

              <p className="text-pretty text-xl text-muted-foreground leading-relaxed">
                PulseCal transforms chaotic appointment scheduling into seamless patient care. Manage appointments,
                records, and communication all in one intelligent platform.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base bg-transparent border-2 hover:border-primary hover:text-primary transition-all duration-200">
                  Watch demo
                </Button>
              </div>

              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-muted-foreground">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-muted-foreground">HIPAA compliant</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative h-[500px] w-full rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 shadow-2xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10" />
                <div className="relative h-full w-full rounded-lg bg-white p-6 shadow-lg">
                  {/* Modern Dashboard Preview */}
                  <div className="grid h-full grid-cols-2 gap-4">
                    {/* Stats Cards */}
                    <div className="space-y-3">
                      <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-green-600">Total Patients</p>
                            <p className="text-2xl font-bold text-green-700">605</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-blue-600">Appointments</p>
                            <p className="text-2xl font-bold text-blue-700">403</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-4 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-orange-600">Pending</p>
                            <p className="text-2xl font-bold text-orange-700">40</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-purple-600">Revenue</p>
                            <p className="text-2xl font-bold text-purple-700">$8,050</p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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

      {/* Problem Section */}
      <section className="border-b border-border bg-destructive/5 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground">
                Healthcare runs on outdated systems that create chaos
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Traditional healthcare management systems are fragmented, complex, and slow. They create bottlenecks
                  that frustrate patients and overwhelm staff.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>Missed appointments cost clinics $150 billion annually</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>Patients wait 30+ minutes on average for appointments</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>Medical records are scattered across multiple systems</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive" />
                    <span>Staff spend hours on manual scheduling and follow-ups</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
                <img src="/frustrated-healthcare-staff-with-paperwork.jpg" alt="Healthcare Problems" className="rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="border-b border-border px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              One platform. Complete control.
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-xl text-muted-foreground leading-relaxed">
              PulseCal brings everything together in one intelligent system designed for modern healthcare.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description:
                  "AI-powered appointment booking that reduces no-shows by 60% with automated reminders and confirmations.",
              },
              {
                icon: Video,
                title: "Telemedicine Ready",
                description:
                  "Built-in video consultations with secure, HIPAA-compliant infrastructure. No third-party tools needed.",
              },
              {
                icon: FileText,
                title: "Unified Records",
                description:
                  "All patient records, prescriptions, and history in one place. Accessible anytime, anywhere.",
              },
              {
                icon: MessageSquare,
                title: "Real-time Communication",
                description: "Secure messaging between patients and providers. Reduce phone calls by 80%.",
              },
              {
                icon: Clock,
                title: "Queue Management",
                description:
                  "Live wait time tracking and patient flow optimization. Keep your clinic running smoothly.",
              },
              {
                icon: BarChart,
                title: "Analytics Dashboard",
                description:
                  "Actionable insights on appointments, revenue, and patient satisfaction at your fingertips.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-pretty text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="border-b border-border bg-muted/20 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Why healthcare providers choose PulseCal
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <Stethoscope className="h-10 w-10 text-success" />
              </div>
              <h3 className="mb-2 text-3xl font-bold text-foreground">98%</h3>
              <p className="text-lg font-medium text-foreground">Patient Satisfaction</p>
              <p className="mt-2 text-muted-foreground">Patients love the convenience</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <h3 className="mb-2 text-3xl font-bold text-foreground">5 hours</h3>
              <p className="text-lg font-medium text-foreground">Saved per day</p>
              <p className="mt-2 text-muted-foreground">Automated workflows free up staff</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <Activity className="h-10 w-10 text-accent" />
              </div>
              <h3 className="mb-2 text-3xl font-bold text-foreground">40%</h3>
              <p className="text-lg font-medium text-foreground">Revenue Increase</p>
              <p className="mt-2 text-muted-foreground">Reduced no-shows and better scheduling</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-based Section */}
      <section id="solutions" className="border-b border-border px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Built for every role in healthcare
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                role: "Patients",
                icon: Heart,
                benefits: [
                  "Book appointments in seconds",
                  "Access medical records anytime",
                  "Get prescription refills online",
                  "Video consultations from home",
                ],
              },
              {
                role: "Doctors",
                icon: Stethoscope,
                benefits: [
                  "See patient history instantly",
                  "Manage schedule efficiently",
                  "E-prescriptions and digital notes",
                  "Focus on care, not paperwork",
                ],
              },
              {
                role: "Receptionists",
                icon: Users,
                benefits: [
                  "Automated appointment reminders",
                  "Real-time queue management",
                  "Quick patient check-in",
                  "Reduce phone call volume",
                ],
              },
              {
                role: "Administrators",
                icon: Shield,
                benefits: [
                  "Complete system analytics",
                  "Revenue and performance insights",
                  "Compliance management",
                  "Staff and resource optimization",
                ],
              },
            ].map((item, index) => (
              <div key={index} className="rounded-2xl border border-border bg-card p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{item.role}</h3>
                </div>
                <ul className="space-y-3">
                  {item.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-b border-border bg-muted/20 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-xl text-muted-foreground leading-relaxed">
              Choose the plan that fits your practice. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "$29",
                period: "per month",
                description: "Perfect for small practices",
                features: [
                  "Up to 100 appointments/month",
                  "Basic scheduling",
                  "Patient records",
                  "Email support",
                  "Mobile app access",
                ],
                popular: false,
              },
              {
                name: "Professional",
                price: "$79",
                period: "per month",
                description: "For growing practices",
                features: [
                  "Unlimited appointments",
                  "Advanced scheduling",
                  "Telemedicine integration",
                  "Analytics dashboard",
                  "Priority support",
                  "Custom branding",
                  "API access",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "pricing",
                description: "For large organizations",
                features: [
                  "Everything in Professional",
                  "Multi-location support",
                  "Dedicated account manager",
                  "Custom integrations",
                  "24/7 phone support",
                  "SLA guarantee",
                  "Training & onboarding",
                ],
                popular: false,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl border-2 p-8 transition-all duration-300 ${
                  plan.popular
                    ? "border-primary bg-card shadow-xl scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="mb-2 text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground"> / {plan.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="border-b border-border px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              About PulseCal
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-xl text-muted-foreground leading-relaxed">
              We're on a mission to revolutionize healthcare management through innovative technology.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">Our Mission</h3>
              <p className="mb-6 text-lg text-muted-foreground leading-relaxed">
                At PulseCal, we believe that healthcare providers should focus on what they do best—caring for
                patients—not wrestling with outdated software. Our platform streamlines every aspect of practice
                management, from appointment scheduling to patient communication.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Founded in 2024, PulseCal was born from the frustration of healthcare professionals who were tired of
                fragmented systems and manual processes. We've built a comprehensive solution that brings everything
                together in one intuitive platform.
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-2xl font-bold text-foreground">Why Choose Us</h3>
              <ul className="space-y-4">
                {[
                  {
                    icon: Shield,
                    title: "HIPAA Compliant",
                    description: "We take data security seriously. All patient information is encrypted and stored securely.",
                  },
                  {
                    icon: Activity,
                    title: "Always Improving",
                    description: "We release new features and improvements every month based on user feedback.",
                  },
                  {
                    icon: Users,
                    title: "Trusted by 500+ Providers",
                    description: "Join hundreds of healthcare professionals who trust PulseCal for their practice management.",
                  },
                  {
                    icon: Clock,
                    title: "24/7 Support",
                    description: "Our dedicated support team is always here to help you succeed.",
                  },
                ].map((item, index) => (
                  <li key={index} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center">
            <h3 className="mb-4 text-2xl font-bold text-foreground">Ready to get started?</h3>
            <p className="mb-6 text-muted-foreground">
              Join us in transforming healthcare management. Start your free trial today.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-base">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-base bg-transparent">
                Contact sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Ready to transform your healthcare practice?
          </h2>
          <p className="mb-8 text-pretty text-xl text-muted-foreground leading-relaxed">
            Join hundreds of healthcare providers who have already switched to PulseCal. Start your free trial today, no
            credit card required.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="text-base shadow-lg hover:shadow-xl transition-shadow">
              Start free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base bg-transparent border-2">
              Schedule a demo
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">14-day free trial • HIPAA compliant • 24/7 support</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
