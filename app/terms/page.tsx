"use client"

import { Header } from "@/components/landing/Header"
import { Footer } from "@/components/landing/Footer"
import { FileText, Scale, AlertCircle, CheckCircle } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Scale className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <FileText className="h-6 w-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using PulseCal, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                PulseCal is a healthcare management platform that provides appointment scheduling, patient record management, telemedicine services, and related healthcare technology solutions.
              </p>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <CheckCircle className="h-6 w-6 text-primary" />
                3. User Accounts
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>3.1 You must create an account to use certain features of our platform.</p>
                <p>3.2 You are responsible for maintaining the confidentiality of your account credentials.</p>
                <p>3.3 You must provide accurate and complete information when creating your account.</p>
                <p>3.4 You are responsible for all activities that occur under your account.</p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">You agree not to:</p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>Use the platform for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the platform's operation</li>
                <li>Use automated systems to access the platform without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Healthcare Services</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>5.1 PulseCal is a technology platform and does not provide medical advice, diagnosis, or treatment.</p>
                <p>5.2 Healthcare providers using our platform are independent practitioners responsible for their own services.</p>
                <p>5.3 We facilitate connections between patients and providers but are not a party to the healthcare relationship.</p>
                <p>5.4 Always seek professional medical advice for health concerns.</p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Payment Terms</h2>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable unless otherwise stated</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>Payment processing is handled by secure third-party providers</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <AlertCircle className="h-6 w-6 text-primary" />
                7. Intellectual Property
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of PulseCal are owned by us and protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, PulseCal shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">9. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless PulseCal from any claims, damages, losses, liabilities, and expenses arising from your use of the platform or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">10. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">11. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of material changes via email or platform notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">12. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which PulseCal operates, without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">13. Contact Information</h2>
              <div className="mt-4 rounded-lg border border-border bg-card p-6">
                <p className="font-semibold text-foreground">PulseCal Legal Department</p>
                <p className="text-muted-foreground">Email: legal@pulsecal.com</p>
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

