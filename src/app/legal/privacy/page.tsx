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
  const t = await getTranslations("legalPrivacy");

  return {
    title: t("title"),
  };
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legalPrivacy");

  return (
    <LegalPage title={t("title")}>
      <LegalSection id="introduction" title={t("section1Title")}>
        <LegalParagraph>
          {t("section1Text1", {
            legalEntity: legalInfo.legalEntity,
            serviceName: legalInfo.serviceName,
          })}
        </LegalParagraph>
        <LegalParagraph>{t("section1Text2")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="data-we-collect" title={t("section2Title")}>
        <LegalList
          items={[
            <>
              {t.rich("section2Item1", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section2Item2", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section2Item3", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section2Item4", { strong: (c) => <strong>{c}</strong> })}
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="how-we-use" title={t("section3Title")}>
        <LegalList
          items={[
            t("section3Item1"),
            t("section3Item2"),
            t("section3Item3"),
            t("section3Item4"),
            t("section3Item5"),
            t("section3Item6"),
          ]}
        />
      </LegalSection>

      <LegalSection id="legal-bases" title={t("section4Title")}>
        <LegalParagraph>{t("section4Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies" title={t("section5Title")}>
        <LegalParagraph>
          {t.rich("section5Text", {
            link: (chunks) => (
              <LegalLink href="/legal/cookies">{chunks}</LegalLink>
            ),
          })}
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="sharing" title={t("section6Title")}>
        <LegalParagraph>{t("section6Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="transfers" title={t("section7Title")}>
        <LegalParagraph>{t("section7Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="retention" title={t("section8Title")}>
        <LegalParagraph>{t("section8Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="your-rights" title={t("section9Title")}>
        <LegalParagraph>{t("section9Intro")}</LegalParagraph>
        <LegalList
          items={[
            <>
              {t.rich("section9Item1", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section9Item2", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section9Item3", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section9Item4", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section9Item5", {
                strong: (c) => <strong>{c}</strong>,
                email: () => <LegalEmailLink />,
              })}
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="security" title={t("section10Title")}>
        <LegalParagraph>{t("section10Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="children" title={t("section11Title")}>
        <LegalParagraph>{t("section11Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="changes" title={t("section12Title")}>
        <LegalParagraph>{t("section12Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title={t("section13Title")}>
        <LegalParagraph>
          {t("section13Text")} <LegalEmailLink />
          {legalInfo.address !== "[Registered address]"
            ? t("section13Mail", { address: legalInfo.address })
            : "."}
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
