import Link from "next/link"
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="PulseCal Logo" className="h-10 w-10 object-contain transition-transform group-hover:scale-110" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">PulseCal</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transforming healthcare management with innovative appointment scheduling and patient care solutions.
            </p>
            <div className="flex gap-4">
              <Link 
                href="https://facebook.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-all duration-200 hover:text-primary hover:scale-110"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link 
                href="https://twitter.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-all duration-200 hover:text-primary hover:scale-110"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link 
                href="https://linkedin.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-all duration-200 hover:text-primary hover:scale-110"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link 
                href="https://instagram.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-all duration-200 hover:text-primary hover:scale-110"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#features" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#solutions" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="#about" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="mailto:careers@pulsecal.com" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="https://blog.pulsecal.com" target="_blank" rel="noopener noreferrer" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="mailto:contact@pulsecal.com" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/hipaa" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  HIPAA Compliance
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="transition-all duration-200 hover:text-primary hover:translate-x-1 inline-block">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PulseCal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
