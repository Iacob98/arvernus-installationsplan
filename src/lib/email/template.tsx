import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
} from "@react-email/components";
import { render } from "@react-email/render";

interface BrandedEmailProps {
  subject: string;
  body: string;
  logoSrc?: string;
  company: {
    name: string;
    street: string;
    postalCode: string;
    city: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    primaryColor: string;
  };
}

function bodyToParagraphs(text: string) {
  return text.split(/\n\n+/).map((block, i) => {
    const parts = block.split("\n");
    return (
      <Text
        key={i}
        style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#333333",
          margin: "0 0 16px",
        }}
      >
        {parts.map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {line}
          </span>
        ))}
      </Text>
    );
  });
}

const RAW_HTML_SENTINEL = "###__BRANDED_RAW_HTML_BODY__###";

/**
 * Renders the BrandedEmail wrapper (header, logo, footer) and substitutes
 * raw HTML into the body region. The wrapping <Text> paragraph that holds
 * the sentinel is replaced entirely so the caller's HTML is not nested
 * inside a <p> tag.
 *
 * Inputs are server-rendered into a static email HTML string; the result is
 * sent via SMTP, never injected into the CRM DOM. Templates are edited only
 * by ADMIN users via the protected server action.
 */
export async function renderBrandedHtmlEmail(opts: {
  subject: string;
  htmlBody: string;
  logoSrc?: string;
  company: BrandedEmailProps["company"];
}): Promise<string> {
  const wrapped = await render(
    BrandedEmail({
      subject: opts.subject,
      body: RAW_HTML_SENTINEL,
      logoSrc: opts.logoSrc,
      company: opts.company,
    }),
  );
  return wrapped.replace(
    new RegExp(`<p[^>]*>\\s*<span[^>]*>\\s*${RAW_HTML_SENTINEL}\\s*</span>\\s*</p>`, "i"),
    opts.htmlBody,
  );
}

export function BrandedEmail({ body, logoSrc, company }: BrandedEmailProps) {
  const finalLogoSrc = logoSrc ?? "cid:logo";
  const footerLines: string[] = [
    company.name,
    `${company.street}, ${company.postalCode} ${company.city}`,
  ];
  if (company.phone) footerLines.push(`Tel: ${company.phone}`);
  if (company.email) footerLines.push(company.email);

  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#f4f4f5", margin: 0, padding: 0 }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: company.primaryColor,
              padding: "24px 32px",
              textAlign: "center" as const,
            }}
          >
            <Img
              src={finalLogoSrc}
              alt={company.name}
              height="48"
              style={{
                height: "48px",
                width: "auto",
                margin: "0 auto",
                filter: "brightness(0) invert(1)",
              }}
            />
          </Section>

          {/* Body */}
          <Section style={{ padding: "32px" }}>
            {bodyToParagraphs(body)}
          </Section>

          <Hr style={{ borderColor: "#e4e4e7", margin: "0 32px" }} />

          {/* Footer */}
          <Section style={{ padding: "24px 32px" }}>
            {footerLines.map((line, i) => (
              <Text
                key={i}
                style={{
                  fontSize: "12px",
                  lineHeight: "1.4",
                  color: "#71717a",
                  margin: "0",
                  textAlign: "center" as const,
                }}
              >
                {line}
              </Text>
            ))}
            {company.website && (
              <Text
                style={{
                  fontSize: "12px",
                  lineHeight: "1.4",
                  margin: "4px 0 0",
                  textAlign: "center" as const,
                }}
              >
                <Link
                  href={
                    company.website.startsWith("http")
                      ? company.website
                      : `https://${company.website}`
                  }
                  style={{ color: company.primaryColor }}
                >
                  {company.website}
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
