export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-16 px-8 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-3xl border-[3px] border-primary p-8 space-y-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-primary mb-2">
          Terms of Service
        </h1>
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-8">
          Last Updated: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-4 font-light text-lg">
          <p>
            Welcome to The Nigerian Dictionary. These Terms of Service outline the rules and regulations for the use of our application.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">1. Acceptance of Terms</h2>
          <p>
            By accessing this application, we assume you accept these terms and conditions. Do not continue to use The Nigerian Dictionary if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">2. User Accounts</h2>
          <p>
            To use certain features of the application, such as submitting words, you must register for an account using Google OAuth. You are responsible for maintaining the confidentiality of your account credentials. You are also solely responsible for any activity that occurs under your account.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">3. User Contributions</h2>
          <p>
            Users can submit words and definitions to the dictionary. By submitting content, you grant The Nigerian Dictionary a non-exclusive, worldwide, royalty-free license to use, reproduce, adapt, publish, translate and distribute it in any and all media. Content must not be illegal, threatening, defamatory, invasive of privacy, or infringing of intellectual property rights.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">4. Verification (KYC)</h2>
          <p>
            Users have the option to verify their identity using a National Identity Number (NIN). This process is completely optional and is used solely to grant verified badges and increase initial reputation scores.
          </p>

          <h2 className="text-xl font-black uppercase tracking-tighter text-primary mt-6">5. Contact Information</h2>
          <p>
            If you have any questions or concerns about these Terms, please contact us at support@thenigeriandictionary.com.
          </p>
        </div>
      </div>
    </div>
  );
}
