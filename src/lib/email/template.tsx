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

interface BrandedEmailProps {
  subject: string;
  body: string;
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

export function BrandedEmail({ body, company }: BrandedEmailProps) {
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
              src="cid:logo"
              alt={company.name}
              height="48"
              style={{ height: "48px", width: "auto" }}
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
