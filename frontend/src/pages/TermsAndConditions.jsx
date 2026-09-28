import React from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

export default function TermsAndConditions() {
  return (
    <div>
      <PageHeader 
        title="Terms and Conditions" 
        description="Rules and regulations for using the internal asset platform." 
      />
      <Card className="prose">
        <p><strong>Last Updated:</strong> October 2023</p>
        <h2>1. System Access and Authorization</h2>
        <p>
          Access to the PropertyNexus system is restricted to authorized 
          personnel of [Organization Name]. You must only access records and features required 
          for your official duties. Unauthorized access, probing, or testing of system vulnerabilities 
          is strictly prohibited.
        </p>
        <h2>2. Acceptable Use</h2>
        <p>By using this platform, you agree to:</p>
        <ul>
          <li>Ensure all data entered is accurate and factual.</li>
          <li>Maintain the confidentiality of your login credentials.</li>
          <li>Only upload documents and photographs directly related to asset management.</li>
          <li>Report any security incidents or suspected unauthorized access immediately.</li>
        </ul>
        <h2>3. Prohibited Activities</h2>
        <p>Users are strictly prohibited from:</p>
        <ul>
          <li>Using the system for personal purposes or non-official business.</li>
          <li>Extracting or exporting data in bulk without explicit authorization.</li>
          <li>Sharing accounts or accessing the system using another individual's credentials.</li>
          <li>Uploading classified material to unclassified asset records.</li>
        </ul>
        <h2>4. Audit and Monitoring</h2>
        <p>
          All actions performed within this system are logged and monitored. [Organization Name] 
          reserves the right to review audit trails at any time to ensure compliance with these 
          terms and applicable data security regulations.
        </p>
        <h2>5. Modifications</h2>
        <p>
          System features, workflows, and these Terms and Conditions may be modified at any time 
          to reflect operational requirements. Continued use of the system constitutes acceptance 
          of the updated terms.
        </p>
        <h2>6. Contact</h2>
        <p>
          For technical support or to report compliance issues, please contact your department 
          administrator or email [Contact Email].
        </p>
      </Card>
    </div>
  );
}
