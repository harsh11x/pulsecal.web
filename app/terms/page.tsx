
"use client"

import { Header } from "@/components/landing/Header"
import { Footer } from "@/components/landing/Footer"
import { Shield, AlertTriangle } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Terms and Conditions
            </h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">
            <section className="bg-destructive/5 border border-destructive/20 p-6 rounded-lg">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-destructive mb-4">
                <AlertTriangle className="h-6 w-6" />
                Critical Liability Disclaimer
              </h2>
              <p className="font-semibold mb-4">
                By using PulseCal, you explicitly acknowledge and agree to the following:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-foreground/80">
                <li>
                  <strong>Not a Medical Provider:</strong> PulseCal is a technology platform, not a medical service provider. We do not provide medical advice, diagnosis, or treatment.
                </li>
                <li>
                  <strong>Doctor Independence:</strong> All Doctors on the platform are independent practitioners. PulseCal is not responsible for their actions, advice, or prescriptions.
                </li>
                <li>
                  <strong>No Liability:</strong> PulseCal shall NOT be liable for any direct, indirect, incidental, or consequential damages arising from:
                  <ul className="list-circle ml-6 mt-1">
                    <li>Medical negligence or malpractice by any Doctor.</li>
                    <li>Adverse reactions to prescriptions or treatments.</li>
                    <li>Misdiagnosis or failure to diagnose.</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using PulseCal, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>
              <p className="text-muted-foreground mb-2">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.
              </p>
              <p className="text-muted-foreground">
                PulseCal reserves the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Subscription and Payments</h2>
              <p className="text-muted-foreground">
                Doctors subscribed to PulseCal agree to the monthly subscription fees. Subscriptions are billed in advance on a recurring monthly basis. You may cancel your subscription at any time, but no refunds will be provided for the current billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Appointments and Cancellations</h2>
              <p className="text-muted-foreground">
                Patients are responsible for attending scheduled appointments. Cancellation policies are set by individual Doctors or Clinics. PulseCal facilitates the booking but is not responsible for disputes regarding missed appointments or refunds.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Communication and Reminders</h2>
              <p className="text-muted-foreground">
                By using PulseCal, you consent to receive appointment reminders, notifications, and other service-related communications via SMS, WhatsApp, and email. You acknowledge that essential service alerts cannot be opted out of, as they are critical for the delivery of healthcare services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Hospital / Clinic Policy</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Right to Suspend or Remove</h3>
                <p className="text-muted-foreground">
                  We reserve the right to suspend, restrict, or permanently remove any hospital or clinic from our platform if:
                </p>
                <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                  <li>We detect fraudulent activity</li>
                  <li>False or misleading information is provided</li>
                  <li>Any illegal or unethical practices are identified</li>
                  <li>There is a violation of our platform policies</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Such actions may be taken without prior notice if deemed necessary to protect patients and platform integrity.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Doctor Terms & Conditions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Platform Fee</h3>
                  <p className="text-muted-foreground">
                    For every patient appointment booked and paid through the platform, we will deduct <strong>3%</strong> as a platform service fee.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Revenue Payout</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li>The revenue generated for clinics/doctors will be calculated weekly.</li>
                    <li>Payments will be transferred to the respective clinic/doctor within <strong>15 days</strong> from the end of each revenue cycle.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Banking Details Requirement</h3>
                  <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                    <li>Clinics and doctors must provide valid and verified banking details to receive payouts.</li>
                    <li>Failure to provide accurate banking information may delay payment processing.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="font-semibold text-foreground">PulseCal Legal Team</p>
                <p className="text-muted-foreground">Email: legal@pulsecal.com</p>
              </div>
            </section>
          </div>
        </div>
      </main >
      <Footer />
    </div >
  )
}
