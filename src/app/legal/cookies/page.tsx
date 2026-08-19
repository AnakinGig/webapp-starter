import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { legalInfo } from "@/lib/legal";
import {
  LegalEmailLink,
  LegalList,
  LegalPage,
  LegalParagraph,
  LegalSection,
} from "@/components/legal/legal-document";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Cookie Policy",
};

export default async function CookiePolicyPage() {
  const t = await getTranslations("legalCookies");

  const cookies = [
    {
      name: "cookie-consent",
      purpose: t("cookie1Purpose"),
      category: t("essential"),
      expiry: t("expiry1Year"),
    },
    {
      name: "better-auth.session_token",
      purpose: t("cookie2Purpose"),
      category: t("essential"),
      expiry: t("expirySession7Days"),
    },
    {
      name: "better-auth.message",
      purpose: t("cookie3Purpose"),
      category: t("functional"),
      expiry: t("expirySession"),
    },
  ];

  return (
    <LegalPage title={t("title")}>
      <LegalSection id="what-are-cookies" title={t("section1Title")}>
        <LegalParagraph>{t("section1Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies-we-use" title={t("section2Title")}>
        <LegalParagraph>
          {t("section2Intro", { serviceName: legalInfo.serviceName })}
        </LegalParagraph>
        <Table className="mt-2 [&_td]:whitespace-normal">
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableCookie")}</TableHead>
              <TableHead>{t("tablePurpose")}</TableHead>
              <TableHead>{t("tableCategory")}</TableHead>
              <TableHead>{t("tableExpiry")}</TableHead>
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
        <LegalParagraph>{t("section2Note")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="consent" title={t("section3Title")}>
        <LegalParagraph>{t("section3Text")}</LegalParagraph>
        <LegalList
          items={[
            <>
              {t.rich("section3Item1", { strong: (c) => <strong>{c}</strong> })}
            </>,
            <>
              {t.rich("section3Item2", { strong: (c) => <strong>{c}</strong> })}
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="managing-cookies" title={t("section4Title")}>
        <LegalParagraph>{t("section4Text")}</LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title={t("section5Title")}>
        <LegalParagraph>
          {t("section5Text")} <LegalEmailLink />.
        </LegalParagraph>
      </LegalSection>
    </LegalPage>
  );
}
