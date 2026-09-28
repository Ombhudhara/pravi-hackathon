import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { downloadAnalyticsExport } from '../services/analytics';

export default function ExportButton({ reportType, params, label = 'Export CSV' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const blob = await downloadAnalyticsExport(reportType, params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: import.meta.env.VITE_APP_TIMEZONE || 'Asia/Kolkata',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date());
      a.download = `${reportType}-report-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-btn-wrap">
      <button
        className="btn btn-outline btn-sm"
        onClick={handleExport}
        disabled={loading}
        aria-label={label}
        type="button"
      >
        {loading
          ? <Loader size={14} aria-hidden="true" />
          : <Download size={14} aria-hidden="true" />}
        <span>{loading ? 'Exporting...' : label}</span>
      </button>
      {error && <p className="export-error" role="alert">{error}</p>}
    </div>
  );
}
