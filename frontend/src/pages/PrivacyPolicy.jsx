import React from 'react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

export default function PrivacyPolicy() {
  return (
    <div>
      <PageHeader 
        title="Privacy Policy" 
        description="Information regarding data collection and usage on this platform." 
      />
      <Card className="prose">
        <p><strong>Last Updated:</strong> October 2023</p>
        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy explains how [Organization Name] collects, uses, and protects information 
          when you use the PropertyNexus system. This system is for internal 
          government use only.
        </p>
        <h2>2. Data Collected</h2>
        <p>We collect the following types of information when you use the system:</p>
        <ul>
          <li><strong>Account Information:</strong> Name, official email address, role, and department identifier.</li>
          <li><strong>System Data:</strong> Uploaded inspection photos, property documents, condition reports, and maintenance logs.</li>
          <li><strong>Usage Data:</strong> System access logs, IP addresses, and audit trails of records modified.</li>
        </ul>
        <h2>3. Use of Data</h2>
        <p>The information collected is used exclusively for:</p>
        <ul>
          <li>Maintaining an accurate inventory of public assets.</li>
          <li>Verifying authorization and managing role-based access.</li>
          <li>Generating operational reports and maintenance schedules.</li>
          <li>Complying with statutory auditing requirements.</li>
        </ul>
        <h2>4. Storage and Security</h2>
        <p>
          All data is stored in secured government data centers or approved secure cloud infrastructure. 
          We implement strict access controls, encryption in transit, and encryption at rest to prevent 
          unauthorized access or disclosure.
        </p>
        <h2>5. Data Retention</h2>
        <p>
          System records, including user activity and asset modifications, are retained permanently 
          in accordance with the Public Records Retention Policy. Account information is retained for 
          the duration of your employment or authorization period.
        </p>
        <h2>6. User Rights</h2>
        <p>
          Authorized users have the right to access and correct their profile information. Any errors 
          in asset records should be corrected following standard departmental data governance procedures.
        </p>
        <h2>7. Contact</h2>
        <p>
          For questions regarding this policy or system security, contact the IT Administration team 
          at [Contact Email] or through your department's standard internal support channels.
        </p>
      </Card>
    </div>
  );
}
