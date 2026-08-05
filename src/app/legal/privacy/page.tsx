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
  title: "Privacy Policy",
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <LegalSection id="introduction" title="1. Introduction">
        <LegalParagraph>
          {legalInfo.legalEntity} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates{" "}
          {legalInfo.serviceName}. This Privacy Policy explains what personal
          data we collect, why we collect it, how we use and protect it, and
          the rights you have over it.
        </LegalParagraph>
        <LegalParagraph>
          By creating an account or using the service, you agree to the
          practices described in this policy. We keep this page up to date and
          mark the date at the top whenever it changes.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="data-we-collect" title="2. Information we collect">
        <LegalList
          items={[
            <>
              <strong>Account data</strong> - your name, email address, and
              profile picture when you register, or when you sign in with a
              third-party provider (such as GitHub OAuth, which shares your
              name, email, and avatar with your permission).
            </>,
            <>
              <strong>Authentication and security data</strong> - a securely
              hashed password if you register with email (never stored in
              plain text), session identifiers, IP addresses, and
              user-agent information, which keep you signed in and help us
              detect abuse.
            </>,
            <>
              <strong>Content you create</strong> - anything you submit,
              publish, or upload through the service.
            </>,
            <>
              <strong>Analytics and marketing data</strong> - only if you
              consent via our cookie banner; we don&apos;t collect any
              tracking data without your choice.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="how-we-use" title="3. How we use your information">
        <LegalList
          items={[
            "To provide, operate, and maintain your account and the service.",
            "To authenticate you and keep your sessions secure.",
            "To communicate with you about your account and service changes.",
            "To prevent fraud, abuse, and security incidents.",
            "To comply with legal obligations.",
            "To improve the service through aggregated analytics - only where you have consented.",
          ]}
        />
      </LegalSection>

      <LegalSection id="legal-bases" title="4. Legal bases for processing">
        <LegalParagraph>
          We process personal data on the following bases: performing the
          contract you enter into when you create an account; our legitimate
          interests in operating and securing the service; your consent (for
          optional analytics and marketing); and compliance with legal
          obligations.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies" title="5. Cookies">
        <LegalParagraph>
          We use a small number of strictly necessary and functional cookies -
          for example to keep you signed in and to remember your consent
          choices. Optional analytics and marketing cookies are only used if
          you allow them through the consent banner, which you can reopen at
          any time from the &ldquo;Cookie settings&rdquo; link in the footer.
          See our <LegalLink href="/legal/cookies">Cookie Policy</LegalLink>{" "}
          for details.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="sharing" title="6. How we share information">
        <LegalParagraph>
          We do not sell your personal data. We share it only with a limited
          set of service providers who process it on our behalf (for example
          our database hosting provider), and with the identity provider you
          choose when signing in with OAuth. These providers are bound by
          data-processing agreements and may only use your data to provide
          services to us.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="transfers" title="7. International transfers">
        <LegalParagraph>
          Your data may be processed in countries other than your own. Where
          we transfer data outside the EEA or the UK, we rely on appropriate
          safeguards such as standard contractual clauses, and we take steps
          to keep that data protected to the same standard described in this
          policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="retention" title="8. Data retention">
        <LegalParagraph>
          We keep your data for as long as your account is active and for as
          long as needed to comply with legal obligations, resolve disputes,
          and enforce our agreements. Session data expires automatically.
          You can delete your account - and all of your data - at any time
          from Settings → Profile → Danger zone.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="your-rights" title="9. Your rights">
        <LegalParagraph>
          Depending on where you live, you may have the right to access,
          rectify, export, erase, restrict, or object to the processing of
          your personal data, and to withdraw consent at any time.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <strong>Access and rectification</strong> - review and edit your
              profile in Settings.
            </>,
            <>
              <strong>Export (portability)</strong> - download your data as
              JSON from Settings → Profile → Account data.
            </>,
            <>
              <strong>Erasure</strong> - delete your account in Settings →
              Profile → Danger zone, which removes your profile, sessions,
              and content.
            </>,
            <>
              <strong>Withdraw consent</strong> - change your cookie choices
              anytime via the footer &ldquo;Cookie settings&rdquo; link.
            </>,
            <>
              <strong>Complaints</strong> - contact us first at{" "}
              <LegalEmailLink />; you also have the right to lodge a complaint
              with your local data-protection authority (EU/UK) or the
              California Privacy Protection Agency (US).
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="security" title="10. Security">
        <LegalParagraph>
          We protect your data with encryption in transit, hashed passwords,
          and access controls. No method of transmission or storage is 100%
          secure, and we cannot guarantee absolute security.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="children" title="11. Children">
        <LegalParagraph>
          The service is not intended for children under 13 (or under 16 in
          the EU/UK). If you believe a child has provided us personal data,
          contact us and we will delete it.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to this policy">
        <LegalParagraph>
          We may update this policy from time to time. Material changes will
          be reflected by the &ldquo;Last updated&rdquo; date at the top of
          this page, and continued use of the service after changes means you
          accept the updated policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact us">
        <LegalParagraph>
          Questions about this policy or your data? Contact us at{" "}
          <LegalEmailLink />
          {legalInfo.address !== "[Registered address]"
            ? ` or by mail at ${legalInfo.address}.`
            : "."}
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  )
}
