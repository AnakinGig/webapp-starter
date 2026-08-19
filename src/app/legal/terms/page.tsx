import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { legalInfo } from "@/lib/legal";
import {
  LegalEmailLink,
  LegalLink,
  LegalList,
  LegalPage,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legalTerms");

  return {
    title: t("title"),
  };
}

export default async function TermsOfServicePage() {
  const t = await getTranslations("legalTerms");

  return (
    <LegalPage title={t("title")}>
      <LegalSection id="agreement" title={t("section1Title")}>
        <LegalParagraph>
          {t("section1Text", {
            serviceName: legalInfo.serviceName,
            legalEntity: legalInfo.legalEntity,
          })}
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="eligibility" title={t("section2Title")}>
        <LegalParagraph>{t("section2Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="accounts" title={t("section3Title")}>
        <LegalList
          items={[
            t("section3Item1"),
            t("section3Item2"),
            t("section3Item3"),
            <LegalEmailLink key="email" />,
            t("section3Item5"),
          ]}
        />
      </LegalSection>

      <LegalSection id="acceptable-use" title={t("section4Title")}>
        <LegalParagraph>{t("section4Intro")}</LegalParagraph>
        <LegalList
          items={[
            t("section4Item1"),
            t("section4Item2"),
            t("section4Item3"),
            t("section4Item4"),
            t("section4Item5"),
            t("section4Item6"),
            t("section4Item7"),
          ]}
        />
      </LegalSection>

      <LegalSection id="content" title={t("section5Title")}>
        <LegalParagraph>{t("section5Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="third-party" title={t("section6Title")}>
        <LegalParagraph>{t("section6Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="termination" title={t("section7Title")}>
        <LegalParagraph>
          {t.rich("section7Text", {
            link: (chunks) => (
              <LegalLink href="/legal/privacy">{chunks}</LegalLink>
            ),
          })}
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="disclaimer" title={t("section8Title")}>
        <LegalParagraph>{t("section8Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="liability" title={t("section9Title")}>
        <LegalParagraph>{t("section9Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="indemnification" title={t("section10Title")}>
        <LegalParagraph>{t("section10Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="changes-to-terms" title={t("section11Title")}>
        <LegalParagraph>{t("section11Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="governing-law" title={t("section12Title")}>
        <LegalParagraph>
          {t("section12Text", { jurisdiction: legalInfo.jurisdiction })}
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="severability" title={t("section13Title")}>
        <LegalParagraph>{t("section13Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title={t("section14Title")}>
        <LegalParagraph>{t("section14Text")}</LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
