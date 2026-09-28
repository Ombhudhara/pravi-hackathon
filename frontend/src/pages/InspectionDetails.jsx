import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Download, AlertCircle, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ConditionBadge from '../components/ConditionBadge';
import PriorityBadge from '../components/PriorityBadge';
import IssueStatusBadge from '../components/IssueStatusBadge';
import Lightbox from '../components/Lightbox';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { getInspectionById } from '../services/inspections';
import { formatDate, formatDateTime } from '../utils/format';
import api from '../services/api';

export default function InspectionDetails() {
  useDocumentTitle('Inspection Details | PropertyNexus');
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.successMessage;

  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const res = await getInspectionById(id);
        if (res.success) {
          setInspection(res.data);
          
          const photos = res.data.attachments?.filter(a => a.category === 'PHOTO') || [];
          const reps = res.data.attachments?.filter(a => a.category === 'REPORT') || [];
          
          setReports(reps);
          
          // Preload object URLs for images
          const imagePromises = photos.map(async (photo) => {
            const blobRes = await api.get(`/attachments/${photo.id}/download?inline=1`, { responseType: 'blob' });
            return {
              ...photo,
              url: URL.createObjectURL(blobRes.data),
              alt: photo.originalName
            };
          });

          const loadedImages = await Promise.all(imagePromises);
          setGalleryImages(loadedImages);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch inspection details');
      } finally {
        setLoading(false);
      }
    };
    fetchInspection();

    return () => {
      // Cleanup object URLs on unmount
      galleryImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [id]);

  const handleDownloadReport = async (report) => {
    try {
      const res = await api.get(`/attachments/${report.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert('Failed to download file.');
    }
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading inspection details...</div>;
  }

  if (error || !inspection) {
    return (
      <EmptyState 
        title="Inspection not found" 
        description={error || "The requested inspection could not be found."}
        action={<Button onClick={() => navigate('/app/inspections')}>Back to inspections</Button>}
      />
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <PageHeader 
        title="Inspection Details" 
        breadcrumbs={[
          { label: 'Inspections', path: '/app/inspections' },
          { label: 'Details' }
        ]}
      />

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--color-status-green-bg)', color: 'var(--color-status-green)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          {successMessage}
        </div>
      )}

      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>
              <Link to={`/app/assets/${inspection.assetId}`} className="text-primary hover:underline">{inspection.assetCode}</Link> - {inspection.assetName}
            </h2>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Inspected by {inspection.inspectorName} on {formatDate(inspection.inspectedAt)}
            </div>
          </div>
          <ConditionBadge condition={inspection.overallCondition} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <Button variant="outline" onClick={() => navigate(`/app/maintenance/new?assetId=${inspection.assetId}&inspectionId=${inspection.id}`)} icon={<AlertCircle size={16} />}>
            Report an issue from this inspection
          </Button>
        </div>

        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Component Conditions</h3>
        <dl style={{ margin: 0, padding: 0 }}>
          <div className="def-item inspection-result">
            <dt>{inspection.assetType === 'LAND' ? 'Site Condition' : 'Building Condition'}</dt>
            <dd><ConditionBadge condition={inspection.buildingCondition} /></dd>
          </div>
          {inspection.assetType !== 'LAND' && (
            <>
              <div className="def-item inspection-result" style={{ marginTop: '0.5rem' }}>
                <dt>Electricity</dt>
                <dd><ConditionBadge condition={inspection.electricity} /></dd>
              </div>
              <div className="def-item inspection-result" style={{ marginTop: '0.5rem' }}>
                <dt>Water</dt>
                <dd><ConditionBadge condition={inspection.water} /></dd>
              </div>
              <div className="def-item inspection-result" style={{ marginTop: '0.5rem' }}>
                <dt>Plumbing</dt>
                <dd><ConditionBadge condition={inspection.plumbing} /></dd>
              </div>
              <div className="def-item inspection-result" style={{ marginTop: '0.5rem' }}>
                <dt>Fire Safety</dt>
                <dd><ConditionBadge condition={inspection.fireSafety} /></dd>
              </div>
            </>
          )}
        </dl>

        {inspection.remarks && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Remarks</h3>
            <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
              {inspection.remarks}
            </div>
          </div>
        )}
      </Card>

      {(galleryImages.length > 0 || reports.length > 0) && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Attachments</h2>
          
          {galleryImages.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-weight-medium)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Photos</h3>
              <div className="gallery-grid">
                {galleryImages.map((img, i) => (
                  <button 
                    key={img.id} 
                    className="gallery-item" 
                    onClick={() => openLightbox(i)}
                    aria-label={`View photo ${i + 1} of ${galleryImages.length}`}
                  >
                    <img src={img.url} alt={img.alt} className="gallery-img" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {reports.length > 0 && (
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-weight-medium)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Reports</h3>
              <div className="file-list">
                {reports.map((report) => (
                  <div key={report.id} className="file-item">
                    <FileText className="file-item-icon" size={20} />
                    <div className="file-item-name" title={report.originalName}>{report.originalName}</div>
                    <div className="file-item-size">{(report.sizeBytes / 1024 / 1024).toFixed(1)} MB</div>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report)} icon={<Download size={14} />}>
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {inspection.linkedIssues && inspection.linkedIssues.length > 0 ? (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-main)' }}>Linked Issues</h2>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Issue Code</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {inspection.linkedIssues.map(issue => (
                  <tr key={issue.id} onClick={() => navigate(`/app/maintenance/${issue.id}`)} style={{ cursor: 'pointer' }} className="stacked-card-row">
                    <td data-label="Issue Code" className="font-mono text-primary font-medium">{issue.issueCode}</td>
                    <td data-label="Title">{issue.title}</td>
                    <td data-label="Priority"><PriorityBadge priority={issue.priority} /></td>
                    <td data-label="Status"><IssueStatusBadge status={issue.status} /></td>
                    <td data-label="Date">{new Date(issue.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Linked Issues</h2>
          <EmptyState 
            title="No issues reported"
            description="There are no maintenance issues linked to this inspection."
          />
        </Card>
      )}

      <Lightbox 
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={galleryImages}
        currentIndex={lightboxIndex}
        onIndexChange={setLightboxIndex}
        title={`Inspection photo ${lightboxIndex + 1} of ${galleryImages.length} for ${inspection.assetCode}`}
      />
    </div>
  );
}
