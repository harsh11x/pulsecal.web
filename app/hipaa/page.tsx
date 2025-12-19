"use client"

import { Header } from "@/components/landing/Header"
import { Footer } from "@/components/landing/Footer"
import { Shield, Lock, CheckCircle2, FileCheck } from "lucide-react"

export default function HIPAAPage() {
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
              HIPAA Compliance
            </h1>
            <p className="text-muted-foreground">PulseCal is committed to protecting patient health information</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">
            <section className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <Lock className="h-6 w-6 text-primary" />
                Our Commitment
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                PulseCal is fully compliant with the Health Insurance Portability and Accountability Act (HIPAA) and the Health Information Technology for Economic and Clinical Health (HITECH) Act. We understand the critical importance of protecting Protected Health Information (PHI) and have implemented comprehensive security measures.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">HIPAA Compliance Features</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    icon: Shield,
                    title: "Encryption",
                    description: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256)",
                  },
                  {
                    icon: Lock,
                    title: "Access Controls",
                    description: "Role-based access controls ensure only authorized personnel can view PHI",
                  },
                  {
                    icon: FileCheck,
                    title: "Audit Logs",
                    description: "Comprehensive audit trails track all access and modifications to health records",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Business Associate Agreements",
                    description: "We sign BAAs with all healthcare providers using our platform",
                  },
                ].map((feature, index) => (
                  <div key={index} className="rounded-lg border border-border bg-card p-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">Security Measures</h2>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>End-to-end encryption for all communications</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure data centers with physical access controls</li>
                <li>Automated backups and disaster recovery procedures</li>
                <li>Multi-factor authentication for all user accounts</li>
                <li>Regular staff training on HIPAA compliance</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">Patient Rights</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Under HIPAA, you have the right to:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>Access your health information</li>
                <li>Request corrections to your records</li>
                <li>Request restrictions on how your information is used</li>
                <li>Receive an accounting of disclosures</li>
                <li>File a complaint if you believe your rights have been violated</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">Business Associate Agreements</h2>
              <p className="text-muted-foreground leading-relaxed">
                PulseCal enters into Business Associate Agreements (BAAs) with all healthcare providers who use our platform. These agreements ensure that we maintain HIPAA compliance and protect PHI in accordance with federal regulations.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">Compliance Certifications</h2>
              <div className="rounded-lg border border-border bg-card p-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>HIPAA Compliant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>HITECH Act Compliant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>SOC 2 Type II Certified</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span>ISO 27001 Certified</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">Breach Notification</h2>
              <p className="text-muted-foreground leading-relaxed">
                In the unlikely event of a data breach, PulseCal will notify affected individuals and the Department of Health and Human Services in accordance with HIPAA requirements. We maintain comprehensive incident response procedures to minimize any potential impact.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">Contact Us</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                For questions about our HIPAA compliance or to request a Business Associate Agreement:
              </p>
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="font-semibold text-foreground">PulseCal Compliance Team</p>
                <p className="text-muted-foreground">Email: compliance@pulsecal.com</p>
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

