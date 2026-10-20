import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const metadata = {
  title: 'Login — AIHPC Advanced',
  description:
    'Sign in to AIHPC Advanced. Public preview users can browse without an account; private / enterprise features require authentication.',
}

/**
 * /login — placeholder login page.
 *
 * Authentication is intentionally deferred to a later phase (per the
 * "no external services" constraint). For now this page:
 *   - surfaces the public preview CTA (no login required)
 *   - captures an email for the waitlist (front-end only — no server
 *     submission, in keeping with the data-residency rule)
 *   - links to the contact email for NDA-protected access
 */
export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Public preview is open — no account needed. For private /
            enterprise access, request an invite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@institution.org"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <Button className="w-full">Sign in</Button>

          <div className="space-y-2 pt-2 text-sm text-muted-foreground">
            <p>
              No account?{' '}
              <Link href="/demos" className="text-primary hover:underline">
                Try the public demo
              </Link>{' '}
              — no signup required.
            </p>
            <p>
              NDA-protected access? Email{' '}
              <a
                href="mailto:testdemoqwenai2025@gmail.com"
                className="text-primary hover:underline"
              >
                testdemoqwenai2025@gmail.com
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
