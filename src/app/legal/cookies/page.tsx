import type { Metadata } from "next"

import { legalInfo } from "@/lib/legal"
import {
  LegalEmailLink,
  LegalList,
  LegalPage,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/legal-document"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Cookie Policy",
}

const cookies = [
  {
    name: "cookie-consent",
    purpose: "Stores your cookie consent choices",
    category: "Essential",
    expiry: "1 year",
  },
  {
    name: "better-auth.session_token",
    purpose: "Keeps you signed in (auth session)",
    category: "Essential",
    expiry: "Session / 7 days",
  },
  {
    name: "better-auth.message",
    purpose: "Transient messages during sign-in/out flows",
    category: "Functional",
    expiry: "Session",
  },
  {
    name: "better-auth.last_used_login_method",
    purpose: "Remembers your preferred sign-in method",
    category: "Functional",
    expiry: "1 year",
  },
  {
    name: "better-auth.popup_token",
    purpose: "Handles OAuth popup sign-in",
    category: "Essential",
    expiry: "Session",
  },
]

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy">
      <LegalSection id="what-are-cookies" title="1. What are cookies?">
        <LegalParagraph>
          Cookies are small text files stored on your device by your browser.
          They let a website recognize your browser and remember information,
          such as your login state or your preferences.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies-we-use" title="2. Cookies we use">
        <LegalParagraph>
          {legalInfo.serviceName} only sets the cookies listed below. We do
          not use third-party advertising cookies. Analytics or marketing
          cookies are only ever set if you explicitly allow them in the
          consent banner.
        </LegalParagraph>
        <Table className="mt-2 [&_td]:whitespace-normal">
          <TableHeader>
            <TableRow>
              <TableHead>Cookie</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cookies.map((cookie) => (
              <TableRow key={cookie.name}>
                <TableCell className="font-mono text-xs">
                  {cookie.name}
                </TableCell>
                <TableCell>{cookie.purpose}</TableCell>
                <TableCell>{cookie.category}</TableCell>
                <TableCell>{cookie.expiry}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <LegalParagraph>
          Note: on HTTPS deployments the auth session cookie is served with a
          secure prefix (<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">__Secure-better-auth.session_token</code>).
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="consent" title="3. Consent">
        <LegalParagraph>
          Essential and functional cookies are required for the service to
          work and are therefore exempt from consent. For any optional
          categories, we ask for your consent through the banner that appears
          on your first visit. You can accept all, accept only essential
          cookies, or open preferences to choose per category.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Withdraw or change your choice</strong> — use the
              &ldquo;Cookie settings&rdquo; link in the footer, or your
              browser&apos;s cookie controls, at any time.
            </>,
            <>
              <strong>How long consent lasts</strong> — your choice is stored
              in a cookie for one year, after which you&apos;ll be asked
              again. We may also re-ask if our policy changes materially.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="managing-cookies" title="4. Managing cookies in your browser">
        <LegalParagraph>
          Most browsers let you view, block, or delete cookies through their
          settings. Blocking essential cookies may prevent the service from
          working correctly (for example, keeping you signed in).
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title="5. Contact">
        <LegalParagraph>
          Questions about this policy? Contact us at <LegalEmailLink />.
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  )
}
