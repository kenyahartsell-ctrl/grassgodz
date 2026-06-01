import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to Grassgodz ("we," "our," or "us"). We operate a lawn care marketplace connecting customers with local service providers in the DC metro area. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application (collectively, the "Service"). By using our Service, you agree to the collection and use of information in accordance with this policy. If you disagree with any part of this policy, please do not use our Service.`
  },
  {
    title: "2. Information We Collect",
    subsections: [
      {
        subtitle: "Information You Provide",
        items: [
          "Name, email address, and phone number",
          "Service address and billing address",
          "Payment information (processed securely via Stripe)",
          "Profile photos and job completion photos",
          "Messages sent through our in-app chat",
          "Reviews and ratings",
          "For service providers: driver's license info, date of birth, vehicle details, and background check consent",
        ]
      },
      {
        subtitle: "Information Collected Automatically",
        items: [
          "Device type, operating system, and browser information",
          "IP address and approximate location (derived from ZIP code)",
          "Usage data such as pages visited and features used",
          "Log data and crash reports",
        ]
      }
    ]
  },
  {
    title: "3. How We Use Your Information",
    items: [
      "To provide, operate, and improve our Service",
      "To match customers with local service providers",
      "To process payments and send receipts",
      "To send transactional emails (booking confirmations, job updates, quotes)",
      "To send SMS notifications (job alerts, chat message notifications, and account updates) only to users who have explicitly opted in",
      "To conduct background checks on service providers (with explicit consent)",
      "To respond to customer support inquiries",
      "To detect and prevent fraud or abuse",
      "To send promotional communications (only with your consent)",
    ]
  },
  {
    title: "4. Sharing Your Information",
    content: "We do not sell your personal information. We may share your information with:",
    items: [
      "Service Providers: Third-party vendors who help us operate our platform (e.g., Stripe for payments, Checkr for background checks, Twilio for SMS delivery, email delivery services)",
      "Other Users: When a job is accepted, limited contact information is shared between customers and their assigned service provider",
      "Legal Requirements: When required by law, court order, or governmental authority",
      "Business Transfers: In connection with a merger, acquisition, or sale of assets",
    ]
  },
  {
    title: "5. SMS Notifications",
    paragraphs: [
      "Grassgodz offers optional SMS notifications to keep you informed about job activity and in-app messages.",
      "Consent: SMS notifications are strictly opt-in. You may consent at account signup or at any time through the SMS Notifications card in your profile settings. We do not send SMS messages to users who have not explicitly opted in.",
      "Types of Messages: We send transactional SMS only, including: new job availability alerts (providers), in-app chat message notifications (providers and customers), and account and job status updates.",
      "Data Collected: When you opt in, we record your phone number, consent status, and the date and time consent was given. This information is stored securely in our platform database and is not sold or shared with third parties except Twilio, our SMS delivery provider, solely for the purpose of message delivery.",
      "Opting Out: You may opt out of SMS notifications at any time by replying STOP to any message, or by toggling off SMS notifications in your profile settings. After opting out you will receive no further SMS from Grassgodz unless you choose to opt back in.",
      "Message and Data Rates: Standard message and data rates may apply depending on your mobile carrier plan.",
    ]
  },
  {
    title: "6. Data Retention",
    content: "We retain your personal information for as long as your account is active or as needed to provide our services. You may request deletion of your account and associated data at any time through the Account settings in the app. Certain data may be retained for legal or financial compliance purposes."
  },
  {
    title: "7. Security",
    content: "We implement industry-standard security measures to protect your information, including SSL/TLS encryption for data in transit and secure, tokenized payment processing via Stripe. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
  },
  {
    title: "8. Your Rights",
    content: "Depending on your location, you may have the right to:",
    items: [
      "Access the personal information we hold about you",
      "Request correction of inaccurate data",
      "Request deletion of your account and data",
      "Opt out of promotional communications at any time",
      "Opt out of SMS notifications at any time",
      "Lodge a complaint with a supervisory authority",
    ],
    footer: "To exercise these rights, contact us at privacy@grassgodz.com."
  },
  {
    title: "9. Children's Privacy",
    content: "Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately."
  },
  {
    title: "10. Third-Party Links",
    content: "Our Service may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies separately."
  },
  {
    title: "11. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes your acceptance of the updated policy.`
  },
  {
    title: "12. Contact Us",
    paragraphs: [
      "If you have any questions about this Privacy Policy, please contact us:",
      "Grassgodz\nWashington, DC Metro Area\nEmail: privacy@grassgodz.com\nWebsite: grassgodz.com",
    ]
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: June 1, 2026</p>

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-foreground mb-3">{section.title}</h2>

                {section.content && (
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3">{section.content}</p>
                )}

                {section.paragraphs && section.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-2 whitespace-pre-line">{p}</p>
                ))}

                {section.subsections && section.subsections.map((sub) => (
                  <div key={sub.subtitle} className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">{sub.subtitle}</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {sub.items.map((item, i) => (
                        <li key={i} className="text-sm text-foreground/80 leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                {section.items && (
                  <ul className="list-disc list-inside space-y-1 mb-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-sm text-foreground/80 leading-relaxed">{item}</li>
                    ))}
                  </ul>
                )}

                {section.footer && (
                  <p className="text-sm text-foreground/80 leading-relaxed mt-2">{section.footer}</p>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}