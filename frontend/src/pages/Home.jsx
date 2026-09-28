import React from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { homeContent } from '../config/homeContent';
import Button from '../components/Button';

// Dynamic icon renderer safely falling back to div
const DynamicIcon = ({ name, ...props }) => {
  const Icon = Icons[name];
  if (!Icon) return <div style={{ width: props.size, height: props.size }} />;
  return <Icon aria-hidden="true" {...props} />;
};

export default function Home() {
  const { user, signupEnabled } = useAuth();
  
  const getDashboardPath = () => {
    if (!user) return '/';
    return '/app';
  };

  const ctaButtons = user ? (
    <Link to={getDashboardPath()} tabIndex={-1}>
      <Button variant="primary" size="lg" className="w-full-mobile">Go to dashboard</Button>
    </Link>
  ) : (
    <div className="hero-actions">
      {signupEnabled && (
        <Link to="/signup" tabIndex={-1}>
          <Button variant="primary" size="lg" className="w-full-mobile">Create account</Button>
        </Link>
      )}
      <Link to="/login" tabIndex={-1}>
        <Button variant="secondary" size="lg" className="w-full-mobile">Sign in</Button>
      </Link>
    </div>
  );

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="section section-hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-text">
            <h1 id="hero-title" className="hero-title">{homeContent.hero.title}</h1>
            <p className="hero-description">{homeContent.hero.description}</p>
            {ctaButtons}
            {!user && signupEnabled && (
              <p className="hero-note">{homeContent.hero.signupNote}</p>
            )}
          </div>
          
          <div className="hero-visual" aria-hidden="true">
            <div className="lifecycle-strip">
              {homeContent.hero.lifecycle.map((stage, i) => (
                <div key={stage.id} className="lifecycle-step">
                  <div className="lifecycle-icon">
                    <DynamicIcon name={stage.icon} size={24} />
                  </div>
                  <span className="lifecycle-label">{stage.label}</span>
                  {i < homeContent.hero.lifecycle.length - 1 && (
                    <div className="lifecycle-connector" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What it does Section */}
      <section id="what-it-does" className="section section-alt" aria-labelledby="what-it-does-title">
        <h2 id="what-it-does-title" className="section-title">{homeContent.whatItDoes.title}</h2>
        <div className="feature-grid">
          {homeContent.whatItDoes.features.map(feature => (
            <div key={feature.id} className="card feature-card">
              <div className="feature-icon">
                <DynamicIcon name={feature.icon} size={28} />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="section" aria-labelledby="how-it-works-title">
        <h2 id="how-it-works-title" className="section-title">{homeContent.howItWorks.title}</h2>
        <ol className="step-list">
          {homeContent.howItWorks.steps.map((step, idx) => (
            <li key={idx} className="step-item">
              <div className="step-number">{idx + 1}</div>
              <span className="step-text">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles Section */}
      <section id="roles" className="section section-alt" aria-labelledby="roles-title">
        <h2 id="roles-title" className="section-title">{homeContent.roles.title}</h2>
        <p className="roles-note">{homeContent.roles.note}</p>
        <div className="roles-grid">
          {homeContent.roles.list.map(role => (
            <div key={role.id} className="card role-card">
              <div className="role-header">
                <DynamicIcon name={role.icon} size={24} />
                <h3 className="role-title">{role.title}</h3>
              </div>
              <ul className="role-permissions">
                {role.permissions.map((perm, i) => (
                  <li key={i}>{perm}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Data and access Section */}
      <section className="section" aria-labelledby="data-title">
        <h2 id="data-title" className="section-title">{homeContent.dataAndAccess.title}</h2>
        <ul className="data-facts">
          {homeContent.dataAndAccess.facts.map((fact, idx) => (
            <li key={idx}>
              <Icons.Check size={20} className="fact-icon" aria-hidden="true" />
              {fact}
            </li>
          ))}
        </ul>
        <div className="data-link-container">
          <Link to="/privacy" className="btn-link">Read our Privacy Policy for details</Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-cta" aria-labelledby="cta-title">
        <div className="cta-panel">
          <h2 id="cta-title" className="cta-title">
            {user ? "Go to dashboard" : homeContent.cta.title}
          </h2>
          <div className="cta-actions">
            {ctaButtons}
          </div>
          {!user && signupEnabled && (
            <p className="hero-note">{homeContent.hero.signupNote}</p>
          )}
        </div>
      </section>
    </div>
  );
}
