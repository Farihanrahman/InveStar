import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Terms & Conditions
            </h1>

            <Card>
              <CardContent className="prose prose-invert max-w-none p-8 space-y-6">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By accessing and using InveStar's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Use License</h2>
                  <p className="text-muted-foreground">
                    Permission is granted to temporarily access and use InveStar's services for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained on InveStar's platform</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Account Eligibility</h2>
                  <p className="text-muted-foreground">
                    You must be at least 18 years old to use InveStar. Our services are available to Bangladesh residents and Non-Resident Bangladeshis (NRBs). By creating an account, you confirm that you meet these eligibility requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Services Provided</h2>
                  <p className="text-muted-foreground mb-4">InveStar provides the following services:</p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li><strong>Portfolio Tracking:</strong> Track your investments across DSE/CSE markets</li>
                    <li><strong>InveStar AI:</strong> AI-powered market analysis for Bangladesh capital markets (educational content only)</li>
                    <li><strong>InveStar Remit:</strong> Cross-border money transfers to Bangladesh via bKash, Nagad, and bank deposit</li>
                    <li><strong>Virtual Trading:</strong> Practice trading with simulated funds</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Financial Disclaimer</h2>
                  <p className="text-muted-foreground">
                    InveStar is not a licensed financial advisor. InveStar AI provides educational content only and should not be considered personalized investment advice. All investment decisions are made at your own risk. Past performance does not guarantee future results. You should consult with a qualified financial advisor before making any investment decisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Remittance Services</h2>
                  <p className="text-muted-foreground">
                    InveStar Remit facilitates cross-border transfers to Bangladesh. All transfers are subject to applicable Bangladesh Bank regulations, BFIU compliance requirements, and anti-money laundering laws. Transfer fees and exchange rates are disclosed before each transaction. The 2.5% government incentive on inward remittances may apply to eligible transfers.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Virtual Trading</h2>
                  <p className="text-muted-foreground">
                    Our virtual trading feature uses simulated funds and does not involve real money transactions. Performance in virtual trading does not indicate future success in real trading. Virtual trading results should be considered for educational purposes only.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Prohibited Activities</h2>
                  <p className="text-muted-foreground">
                    You may not use our service to:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                    <li>Engage in any illegal or fraudulent activity</li>
                    <li>Manipulate market data or prices</li>
                    <li>Interfere with the security of the platform</li>
                    <li>Transmit malware or harmful code</li>
                    <li>Violate any applicable laws or regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    InveStar shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, the service. Investment losses are not the responsibility of InveStar.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Changes to Terms</h2>
                  <p className="text-muted-foreground">
                    We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform. Continued use of the service after such modifications constitutes acceptance of the updated terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Governing Law</h2>
                  <p className="text-muted-foreground">
                    These terms shall be governed by and construed in accordance with the laws of Bangladesh, without regard to its conflict of law provisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Information</h2>
                  <p className="text-muted-foreground">
                    If you have any questions about these Terms & Conditions, please contact us at hello@investarbd.com.
                  </p>
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

export default Terms;
