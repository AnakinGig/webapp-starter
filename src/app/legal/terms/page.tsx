import type { Metadata } from "next"

import { legalInfo } from "@/lib/legal"
import {
  LegalEmailLink,
  LegalLink,
  LegalList,
  LegalPage,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/legal-document"

export const metadata: Metadata = {
  title: "Terms of Service",
}

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service">
      <LegalSection id="agreement" title="1. Agreement to these terms">
        <LegalParagraph>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to
          and use of {legalInfo.serviceName}, operated by {legalInfo.legalEntity}. By
          creating an account or using the service, you agree to these Terms.
          If you do not agree, please do not use the service.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <LegalParagraph>
          You must be at least 13 years old (or 16 in the EU/UK) and have the
          legal capacity to accept these Terms to use the service. By using
          the service you confirm that you meet these requirements.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts and security">
        <LegalList
          items={[
            "You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.",
            "You must provide accurate information and keep it up to date.",
            "You must notify us immediately of any unauthorized use of your account at ",
            <>
              <LegalEmailLink />
            </>,
            "We may suspend accounts that we reasonably believe are compromised or being misused.",
          ]}
        />
      </LegalSection>

      <LegalSection id="acceptable-use" title="4. Acceptable use">
        <LegalParagraph>
          You agree not to use the service to:
        </LegalParagraph>
        <LegalList
          items={[
            "Violate any applicable law or regulation.",
            "Harass, abuse, or harm other people.",
            "Attempt to access accounts, systems, or data you are not authorized to access.",
            "Disrupt or degrade the service for others.",
            "Upload malicious software or content.",
            "Impersonate another person or entity.",
            "Infringe the intellectual property or other rights of others.",
          ]}
        />
      </LegalSection>

      <LegalSection id="content" title="5. User content">
        <LegalParagraph>
          You retain ownership of the content you create. You grant us a
          non-exclusive, worldwide, royalty-free license to host, store, and
          display your content solely to operate and improve the service. You
          are responsible for the content you submit, and we may remove
          content that violates these Terms or applicable law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="third-party" title="6. Third-party services">
        <LegalParagraph>
          The service may integrate with third-party providers (for example
          signing in with GitHub). Your use of those services is subject to
          their own terms and privacy policies, and we are not responsible
          for them.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="termination" title="7. Suspension and termination">
        <LegalParagraph>
          You can stop using the service and delete your account at any time
          from Settings → Profile → Danger zone. We may suspend or terminate
          your access if you breach these Terms, if required by law, or if
          continued operation would create a security or abuse risk. Upon
          termination your right to use the service ends, and we will delete
          your data in accordance with our{" "}
          <LegalLink href="/legal/privacy">Privacy Policy</LegalLink>.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="disclaimer" title="8. Disclaimer of warranties">
        <LegalParagraph>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranties of any kind, whether express
          or implied, including implied warranties of merchantability,
          fitness for a particular purpose, and non-infringement. We do not
          warrant that the service will be uninterrupted, error-free, or
          secure.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="liability" title="9. Limitation of liability">
        <LegalParagraph>
          To the maximum extent permitted by law, we will not be liable for
          any indirect, incidental, special, consequential, or punitive
          damages, or for any loss of profits, data, or goodwill, arising out
          of or relating to your use of the service. Our total aggregate
          liability for all claims will not exceed the amount you paid us in
          the twelve months preceding the claim.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="indemnification" title="10. Indemnification">
        <LegalParagraph>
          You agree to indemnify and hold us harmless from any claims,
          damages, losses, and expenses arising out of your use of the
          service, your content, or your breach of these Terms.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="changes-to-terms" title="11. Changes to these Terms">
        <LegalParagraph>
          We may update these Terms from time to time. We will update the
          &ldquo;Last updated&rdquo; date at the top of this page, and
          continued use of the service after changes take effect constitutes
          acceptance of the updated Terms.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="governing-law" title="12. Governing law">
        <LegalParagraph>
          These Terms are governed by the laws of {legalInfo.jurisdiction},
          without regard to conflict-of-law rules. Any disputes will be
          resolved in the courts of {legalInfo.jurisdiction}.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="severability" title="13. Severability">
        <LegalParagraph>
          If any provision of these Terms is found to be unenforceable, the
          remaining provisions will continue in full force and effect.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title="14. Contact">
        <LegalParagraph>
          Questions about these Terms? Contact us at <LegalEmailLink />.
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  )
}
