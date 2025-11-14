import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | gICM",
  description: "Privacy Policy for gICM - AI Dev Stack for Web3",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-300 via-emerald-300 to-teal-300">
      {/* Header */}
      <div className="border-b border-black/20 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-black/80 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12">
        <div className="rounded-xl border border-black/20 bg-white/90 backdrop-blur p-8 md:p-12">
          <h1 className="text-4xl font-black text-black mb-4">Privacy Policy</h1>
          <p className="text-sm text-black/60 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-black max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-black text-black mb-3">1. Introduction</h2>
              <p className="text-black/80 leading-relaxed">
                Welcome to gICM ("we", "our", or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our marketplace platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">2. Information We Collect</h2>
              <p className="text-black/80 leading-relaxed mb-3">
                We collect information that you provide directly to us when using gICM:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/80">
                <li><strong>Email Address:</strong> When you join our waitlist or sign up for alpha access</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our marketplace, including items viewed, searches performed, and stacks created</li>
                <li><strong>Analytics Data:</strong> We collect anonymous analytics data to improve our service, including page views, session duration, and feature usage</li>
                <li><strong>Device Information:</strong> Browser type, operating system, and IP address for security and service improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">3. How We Use Your Information</h2>
              <p className="text-black/80 leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/80">
                <li>Provide, maintain, and improve our marketplace services</li>
                <li>Process waitlist registrations and alpha key requests</li>
                <li>Send you updates about gICM, including new features and marketplace items</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">4. Data Storage and Security</h2>
              <p className="text-black/80 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">5. Third-Party Services</h2>
              <p className="text-black/80 leading-relaxed mb-3">
                gICM may integrate with third-party services, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/80">
                <li><strong>Anthropic Claude AI:</strong> For AI-powered stack building features</li>
                <li><strong>Analytics Providers:</strong> To understand usage patterns and improve our service</li>
                <li><strong>Infrastructure Providers:</strong> For hosting and deployment (Vercel, AWS)</li>
              </ul>
              <p className="text-black/80 leading-relaxed mt-3">
                These third parties have their own privacy policies. We are not responsible for their privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">6. Cookies and Tracking</h2>
              <p className="text-black/80 leading-relaxed">
                We use local storage and cookies to enhance your experience, remember your preferences (such as theme settings and stack selections), and collect analytics data. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">7. Your Rights</h2>
              <p className="text-black/80 leading-relaxed mb-3">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/80">
                <li><strong>Access:</strong> Request access to your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request a copy of your data in a structured format</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">8. Children's Privacy</h2>
              <p className="text-black/80 leading-relaxed">
                gICM is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">9. Changes to This Policy</h2>
              <p className="text-black/80 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-black mb-3">10. Contact Us</h2>
              <p className="text-black/80 leading-relaxed mb-3">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-black/5 rounded-lg p-4 text-black/80">
                <p><strong>Email:</strong> privacy@gicm.dev</p>
                <p><strong>GitHub:</strong> github.com/Kermit457/gICM</p>
              </div>
            </section>

            <section className="mt-12 pt-8 border-t border-black/10">
              <h2 className="text-2xl font-black text-black mb-3">GDPR Compliance (EU Users)</h2>
              <p className="text-black/80 leading-relaxed mb-3">
                If you are located in the European Economic Area (EEA), you have certain data protection rights under GDPR. We process your personal data based on:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/80">
                <li><strong>Consent:</strong> When you sign up for our waitlist or services</li>
                <li><strong>Legitimate Interest:</strong> To improve our services and prevent fraud</li>
                <li><strong>Contract Performance:</strong> To provide services you've requested</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-black text-black mb-3">CCPA Compliance (California Users)</h2>
              <p className="text-black/80 leading-relaxed mb-3">
                California residents have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-6 space-y-2 text-black/80">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to opt-out of the sale of personal information (we do not sell personal data)</li>
                <li>Right to deletion of personal information</li>
                <li>Right to non-discrimination for exercising your privacy rights</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-black/10">
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-6 py-3 rounded-lg bg-lime-300 text-black font-bold hover:bg-lime-400 transition-colors"
              >
                Return to Home
              </Link>
              <Link
                href="/terms"
                className="px-6 py-3 rounded-lg border-2 border-black/20 text-black font-bold hover:border-black/40 transition-colors"
              >
                View Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
