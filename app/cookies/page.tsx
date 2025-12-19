"use client"

import { Header } from "@/components/landing/Header"
import { Footer } from "@/components/landing/Footer"
import { Cookie, Settings, Info, Shield } from "lucide-react"

export default function CookiePolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="mb-12 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground">
                <Info className="h-6 w-6 text-primary" />
                1. What Are Cookies?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit a website. They help websites remember your preferences and improve your browsing experience. PulseCal uses cookies to enhance functionality and provide personalized services.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                    <Shield className="h-5 w-5 text-primary" />
                    Essential Cookies
                  </h3>
                  <p className="mb-3 text-muted-foreground">
                    These cookies are necessary for the platform to function properly. They enable core functionality such as security, authentication, and session management.
                  </p>
                  <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Session management cookies</li>
                    <li>Authentication tokens</li>
                    <li>Security cookies</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
                    <Settings className="h-5 w-5 text-primary" />
                    Functional Cookies
                  </h3>
                  <p className="mb-3 text-muted-foreground">
                    These cookies remember your preferences and settings to provide a personalized experience.
                  </p>
                  <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Language preferences</li>
                    <li>Theme settings (light/dark mode)</li>
                    <li>User interface preferences</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <h3 className="mb-3 text-xl font-semibold text-foreground">Analytics Cookies</h3>
                  <p className="mb-3 text-muted-foreground">
                    These cookies help us understand how visitors interact with our platform, allowing us to improve performance and user experience.
                  </p>
                  <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Page views and navigation patterns</li>
                    <li>Feature usage statistics</li>
                    <li>Performance metrics</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">3. Third-Party Cookies</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                We may use third-party services that set cookies on your device. These include:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li><strong>Analytics providers:</strong> To understand platform usage and improve services</li>
                <li><strong>Payment processors:</strong> To securely process transactions</li>
                <li><strong>Customer support tools:</strong> To provide assistance when needed</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Managing Cookies</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                You can control and manage cookies in several ways:
              </p>
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="mb-2 font-semibold text-foreground">Browser Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Most browsers allow you to refuse or delete cookies. You can usually find these settings in your browser's privacy or security options.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="mb-2 font-semibold text-foreground">Platform Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    You can manage cookie preferences in your PulseCal account settings. Note that disabling certain cookies may affect platform functionality.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Cookie Duration</h2>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li><strong>Session cookies:</strong> Temporary cookies that expire when you close your browser</li>
                <li><strong>Persistent cookies:</strong> Remain on your device for a set period or until you delete them</li>
                <li><strong>Authentication cookies:</strong> Typically expire after 30 days of inactivity</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Impact of Disabling Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                While you can disable cookies, doing so may impact your experience:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-muted-foreground">
                <li>You may need to log in more frequently</li>
                <li>Some features may not work as expected</li>
                <li>Personalization settings may be lost</li>
                <li>Platform performance may be affected</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">7. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the updated policy on this page.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Contact Us</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us:
              </p>
              <div className="rounded-lg border border-border bg-card p-6">
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

