import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 text-sm leading-6">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>

      <p className="mb-4">
        This privacy policy outlines how the LinkedIn Scraper Chrome Extension (“the Extension”) collects, uses, and protects your information.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p className="mb-4">
        When using the Extension, we may collect the following data (if publicly available on LinkedIn):
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Full Name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Job title, company, and profile link</li>
        <li>Reactions, comments, and repost statistics</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use This Information</h2>
      <p className="mb-4">
        The collected information is used solely for:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Helping users export and manage public LinkedIn engagement data</li>
        <li>Displaying this data in the Extension popup interface</li>
        <li>Allowing export in formats such as CSV</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Storage</h2>
      <p className="mb-4">
        Data is stored locally in your browser’s memory or optionally synchronized with your account (if login is implemented). We do not automatically transmit or sell your data to any third party.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Data Sharing</h2>
      <p className="mb-4">
        We do not share, sell, or transfer your personal information to any third party, except if required by law or with your explicit consent.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Permissions</h2>
      <p className="mb-4">
        The Extension uses Chrome permissions such as <code>activeTab</code>, <code>storage</code>, <code>cookies</code>, and access to LinkedIn pages (<code>*://www.linkedin.com/*</code>) to function correctly. These permissions are strictly limited to the Extension’s core scraping and data display features.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. User Rights</h2>
      <p className="mb-4">
        You have the right to request access, correction, or deletion of any personal data stored locally or optionally synced. Contact us directly to make such a request.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes</h2>
      <p className="mb-4">
        We may update this policy periodically. Any updates will be posted on this page with a revised "Last updated" date.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Contact</h2>
      <p className="mb-4">
        If you have any questions or concerns, please contact us at:{" "}
        <a href="mailto:your@email.com" className="text-blue-600">
          your@email.com
        </a>
      </p>

      <p className="text-sm text-gray-500 mt-8">Last updated: May 30, 2025</p>
    </div>
  );
};

export default PrivacyPolicy;
