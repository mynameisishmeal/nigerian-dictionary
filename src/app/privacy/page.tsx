export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-16 px-8 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-3xl border-[3px] border-primary p-8 space-y-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-primary mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">
          Last Updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-4 font-light text-lg">
          <p>
            Welcome to The Nigerian Dictionary. We are committed to protecting your personal information and your right to privacy.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">1. Information We Collect</h2>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, or otherwise when you contact us. This includes your email address (via Google OAuth) and an optional National Identity Number (NIN) for verification purposes.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">2. How We Use Your Information</h2>
          <p>
            We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To post testimonials and dictionary contributions.</li>
              <li>To manage user accounts and reputation scores.</li>
            </ul>
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">3. Will Your Information Be Shared?</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Your optional NIN is securely hashed and never shared publicly.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">4. Contact Us</h2>
          <p>
            If you have questions or comments about this notice, you may email us at support@thenigeriandictionary.com.
          </p>
        </div>
      </div>
    </div>
  );
}
