'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const CONTACT_EMAIL = 'testdemoqwenai2025@gmail.com'

/**
 * SiteFooter — global footer rendered from RootLayout.
 *
 * Visible on every page so visitors always have:
 *   - a clear Return to Home option
 *   - compliance acknowledgements (GDPR / HIPAA)
 *   - a contact e-mail address
 *
 * Compliance copy is intentionally short and points readers to the contact
 * e-mail for the underlying DPA / BAA paperwork rather than making legal
 * claims on its own.
 */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand + return home */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 text-white text-xs font-bold">
                A
              </span>
              <span className="font-semibold">AIHPC Advanced</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Public preview mirror of the AIHPC Advanced scientific computing
              platform. Source-of-truth lives in the private
              <code className="mx-1 rounded bg-muted px-1 text-xs">
                AIHPC-Advanced
              </code>
              repository.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/preview1" className="hover:text-foreground">
                  Preview 1
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-foreground"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>For NDA-protected access, request an invite.</li>
              <li>For public preview, use this repo directly.</li>
            </ul>
          </div>

          {/* Compliance */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Compliance</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">GDPR</span> —
                Data subject rights honored. No personal data is collected by
                this preview site. DPA available on request.
              </li>
              <li>
                <span className="font-medium text-foreground">HIPAA</span> —
                No PHI is processed in the public preview. BAA available for
                enterprise deployments.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} AIHPC Advanced. All rights
            reserved.
          </p>
          <p>
            Public mirror:{' '}
            <a
              className="hover:text-foreground"
              href="https://github.com/testdemoqwenai2025-creator/DemoAIHPC"
              target="_blank"
              rel="noreferrer noopener"
            >
              DemoAIHPC
            </a>{' '}
            &middot; Private source-of-truth:{' '}
            <a
              className="hover:text-foreground"
              href="https://github.com/testdemoqwenai2025-creator/AIHPC-Advanced"
              target="_blank"
              rel="noreferrer noopener"
            >
              AIHPC-Advanced
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
