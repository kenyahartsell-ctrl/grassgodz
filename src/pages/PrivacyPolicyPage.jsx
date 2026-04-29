import PublicNav from '@/components/public/PublicNav';
import PublicFooter from '@/components/public/PublicFooter';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav />
      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: April 2025</p>

          <div className="prose prose-sm max-w-none space-y-8 text-foreground">

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Grassgodz ("we," "our," or "us"). We operate a lawn care marketplace connecting customers with local service providers in the DC metro area. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application (collectively, the "Service").
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                By using our Service, you agree to the collection and use of information in accordance with this policy. If you disagree with any part of this policy, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">2. Information We Collect</h2>
              <h3 className="text-base font-semibold text-foreground mb-2">Information You Provide</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
                <li>Name, email address, and phone number</li>
                <li>Service address and billing address</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Profile photos and job completion photos</li>
                <li>Messages sent through our in-app chat</li>
                <li>Reviews and ratings</li>
                <li>For service providers: driver's license info, date of birth, vehicle details, and background check consent</li>
              </ul>

              <h3 className="text-base font-semibold text-foreground mb-2 mt-4">Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
                <li>Device type, operating system, and browser information</li>
                <li>IP address and approximate location (derived from ZIP code)</li>
                <li>Usage data such as pages visited and features used</li>
                <li>Log data and crash reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
                <li>To provide, operate, and improve our Service</li>
                <li>To match customers with local service providers</li>
                <li>To process payments and send receipts</li>
                <li>To send transactional emails (booking confirmations, job updates, quotes)</li>
                <li>To conduct background checks on service providers (with explicit consent)</li>
                <li>To respond to customer support inquiries</li>
                <li>To detect and prevent fraud or abuse</li>
                <li>To send promotional communications (only with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">4. Sharing Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our platform (e.g., Stripe for payments, Checkr for background checks, email delivery services)</li>
                <li><strong>Other Users:</strong> When a job is accepted, limited contact information is shared between customers and their assigned service provider</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide our services. You may request deletion of your account and associated data at any time through the Account settings in the app. Certain data may be retained for legal or financial compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">6. Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your information, including SSL/TLS encryption for data in transit and secure, tokenized payment processing via Stripe. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">7. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 leading-relaxed">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of promotional communications at any time</li>
                <li>Lodge a complaint with a supervisory authority</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise these rights, contact us at <a href="mailto:privacy@grassgodz.com" className="text-primary hover:underline">privacy@grassgodz.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">9. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies separately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="mt-3 bg-secondary/40 rounded-xl p-4 text-sm text-foreground space-y-1">
                <p><strong>Grassgodz</strong></p>
                <p>Washington, DC Metro Area</p>
                <p>Email: <a href="mailto:privacy@grassgodz.com" className="text-primary hover:underline">privacy@grassgodz.com</a></p>
                <p>Website: <a href="https://grassgodz.com" className="text-primary hover:underline">grassgodz.com</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}