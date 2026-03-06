import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Privacy & Security Policy
            </h1>

            <Card>
              <CardContent className="prose prose-invert max-w-none p-8 space-y-6">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground">
                    InveStar ("we", "our", or "us") is committed to protecting your privacy and securing your financial information. This Privacy & Security Policy explains how we collect, use, disclose, and safeguard your information when you use our fintech platform and services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Personal Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Name, email address, phone number</li>
                    <li>Government-issued identification (as required by financial regulations)</li>
                    <li>Date of birth and residential address</li>
                    <li>Financial information including bank account details</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">Transaction Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Investment history and portfolio holdings</li>
                    <li>Trading activity and transaction records</li>
                    <li>Payment information and wallet connections</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">Technical Information</h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>IP address, device information, and browser type</li>
                    <li>Usage data and interaction with our platform</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>To provide and maintain our investment services</li>
                    <li>To process your transactions and manage your portfolio</li>
                    <li>To verify your identity and comply with KYC/AML regulations</li>
                    <li>To send you important updates about your account and investments</li>
                    <li>To improve our services and develop new features</li>
                    <li>To detect and prevent fraud, money laundering, and other illegal activities</li>
                    <li>To comply with legal obligations and regulatory requirements</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security Measures</h2>
                  <p className="text-muted-foreground mb-4">
                    We implement industry-leading security measures to protect your information:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Encryption:</strong> All data transmission is encrypted using TLS 1.3 protocol</li>
                    <li><strong>Data Storage:</strong> Sensitive data is encrypted at rest using AES-256 encryption</li>
                    <li><strong>Access Controls:</strong> Multi-factor authentication and role-based access controls</li>
                    <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection systems</li>
                    <li><strong>Regular Audits:</strong> Third-party security audits and penetration testing</li>
                    <li><strong>Secure Infrastructure:</strong> Enterprise-grade cloud infrastructure with redundancy</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Information Sharing and Disclosure</h2>
                  <p className="text-muted-foreground mb-4">
                    We may share your information with:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our platform (Supabase for database, Stripe for payments)</li>
                    <li><strong>AI Services:</strong> Google Gemini and OpenAI for InveStar AI market analysis features (conversation data is processed but not stored by AI providers)</li>
                    <li><strong>Remittance Partners:</strong> bKash, Nagad, and banking partners for processing cross-border transfers to Bangladesh</li>
                    <li><strong>Financial Institutions:</strong> Banks and payment processors for transaction processing</li>
                    <li><strong>Regulatory Bodies:</strong> Bangladesh Bank (BFIU), government agencies as required by law</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or legal process</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    We never sell your personal information to third parties for marketing purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Financial Data Protection</h2>
                  <p className="text-muted-foreground">
                    As a fintech platform, we adhere to strict financial data protection standards:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Compliance with Bangladesh Bank regulations</li>
                    <li>PCI DSS compliance for payment card data</li>
                    <li>Adherence to international financial data protection standards</li>
                    <li>Regular security assessments and vulnerability testing</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Your Privacy Rights</h2>
                  <p className="text-muted-foreground mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Access your personal data and request a copy</li>
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Request deletion of your data (subject to legal retention requirements)</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Export your investment data</li>
                    <li>Lodge a complaint with relevant data protection authorities</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Data Retention</h2>
                  <p className="text-muted-foreground">
                    We retain your information for as long as necessary to provide our services and comply with legal obligations. Financial transaction records are retained for a minimum of 7 years as required by regulatory authorities. Account information is retained until you request deletion, subject to legal retention requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Cookies and Tracking</h2>
                  <p className="text-muted-foreground">
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Third-Party Links</h2>
                  <p className="text-muted-foreground">
                    Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">11. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">12. International Data Transfers</h2>
                  <p className="text-muted-foreground">
                    Your information may be transferred to and processed in countries other than Bangladesh. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">13. Incident Response</h2>
                  <p className="text-muted-foreground">
                    In the event of a data breach that affects your personal information, we will notify you and relevant authorities within 72 hours as required by law. We maintain an incident response plan to quickly address and mitigate any security incidents.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">14. Updates to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Privacy & Security Policy periodically to reflect changes in our practices or legal requirements. We will notify you of any material changes via email or through a prominent notice on our platform. Continued use of our services after such changes constitutes acceptance of the updated policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">15. Contact Us</h2>
                  <p className="text-muted-foreground">
                    If you have questions about this Privacy & Security Policy or wish to exercise your privacy rights, please contact us:
                  </p>
                  <div className="mt-4 text-muted-foreground">
                    <p>Email: hello@investarbd.com</p>
                    <p>Data Protection Officer: dpo@investarbd.com</p>
                    <p>Address: Hero City, 55 E 3rd Ave, San Mateo, CA 94401, USA</p>
                  </div>
                </section>

                <p className="text-sm text-muted-foreground italic">
                  Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
