"use client"

import { Header } from "@/components/landing/Header"
import { Footer } from "@/components/landing/Footer"
import { Shield, Lock, Eye, FileText } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <Lock className="h-6 w-6 text-primary" />
                1. Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                PulseCal ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare management platform.
              </p>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <Eye className="h-6 w-6 text-primary" />
                2. Information We Collect
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">2.1 Personal Information</h3>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Name, email address, phone number, and date of birth</li>
                    <li>Medical history, prescriptions, and health records</li>
                    <li>Payment information and billing details</li>
                    <li>Location data for doctor discovery features</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">2.2 Usage Data</h3>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Device information and IP address</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Appointment booking history</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <FileText className="h-6 w-6 text-primary" />
                3. How We Use Your Information
              </h2>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>To provide and maintain our healthcare management services</li>
                <li>To process appointments and manage patient records</li>
                <li>To send appointment reminders and notifications</li>
                <li>To improve our platform and develop new features</li>
                <li>To comply with legal obligations and HIPAA requirements</li>
                <li>To detect and prevent fraud or security issues</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal and health information. All data is stored in compliance with HIPAA regulations.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell your personal information. We may share your information only with:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>Healthcare providers you choose to interact with</li>
                <li>Service providers who assist in platform operations</li>
                <li>Legal authorities when required by law</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Your Rights</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                You have the right to:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>Access and review your personal information</li>
                <li>Request corrections to inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your health records</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance your experience. For more details, please see our Cookie Policy.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform is not intended for children under 13. We do not knowingly collect information from children.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">9. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">10. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 rounded-lg border border-border bg-card p-6">
                <p className="font-semibold text-foreground">PulseCal Privacy Team</p>
                <p className="text-muted-foreground">Email: privacy@pulsecal.com</p>
                <p className="text-muted-foreground">Phone: 1-800-PULSECAL</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

