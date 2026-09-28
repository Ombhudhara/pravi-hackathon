import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, FileText, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import ChecklistRadioGroup from '../components/ChecklistRadioGroup';
import FileDropzone from '../components/FileDropzone';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAssets from '../hooks/useAssets';
import { createInspection } from '../services/inspections';
import { calculateOverallCondition, getDecidingSentence } from '../utils/condition';
import ConditionBadge from '../components/ConditionBadge';

export default function InspectionForm() {
  useDocumentTitle('New Inspection | PropertyNexus');
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialAssetId = searchParams.get('assetId') || '';

  const { assets, loading: loadingAssets } = useAssets({ limit: 1000 }); // Fetch simplified asset list for combobox

  const [formData, setFormData] = useState({
    assetId: initialAssetId,
    inspectedAt: new Date().toISOString().slice(0, 16),
    building_condition: 'NOT_APPLICABLE',
    electricity: 'NOT_APPLICABLE',
    water: 'NOT_APPLICABLE',
    plumbing: 'NOT_APPLICABLE',
    fire_safety: 'NOT_APPLICABLE',
    remarks: ''
  });

  const [photos, setPhotos] = useState([]);
  const [reports, setReports] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, [photos]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedAsset = useMemo(() => {
    return assets.find(a => a.id === formData.assetId);
  }, [assets, formData.assetId]);

  const isLand = selectedAsset?.type === 'LAND';

  // Force other components to NOT_APPLICABLE if LAND
  useEffect(() => {
    if (isLand) {
      setFormData(prev => ({
        ...prev,
        electricity: 'NOT_APPLICABLE',
        water: 'NOT_APPLICABLE',
        plumbing: 'NOT_APPLICABLE',
        fire_safety: 'NOT_APPLICABLE'
      }));
    }
  }, [isLand]);

  const overallCondition = useMemo(() => {
    return calculateOverallCondition(formData);
  }, [formData]);

  const handlePhotosDrop = (acceptedFiles) => {
    if (photos.length + acceptedFiles.length > 10) {
      alert('Maximum 10 photos allowed.');
      return;
    }
    const newPhotos = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleReportsDrop = (acceptedFiles) => {
    if (reports.length + acceptedFiles.length > 3) {
      alert('Maximum 3 reports allowed.');
      return;
    }
    setReports(prev => [...prev, ...acceptedFiles]);
  };

  const removeReport = (index) => {
    const newReports = [...reports];
    newReports.splice(index, 1);
    setReports(newReports);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId) {
      setSubmitError('Please select an asset.');
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      photos.forEach(file => {
        data.append('photos', file);
      });

      reports.forEach(file => {
        data.append('reports', file);
      });

      const res = await createInspection(data);
      if (res.success) {
        // Prevent unsaved changes prompt if we implement it later
        navigate(`/app/inspections/${res.data.id}`, { state: { successMessage: 'Inspection recorded successfully.' } });
      } else {
        setSubmitError(res.message);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader 
        title="New Inspection" 
        description="Record a condition assessment for a property."
      />

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {submitError && (
            <div className="alert alert-danger" style={{ backgroundColor: 'var(--color-status-red-bg)', color: 'var(--color-status-red)' }} aria-live="assertive">
              {submitError}
            </div>
          )}

          <section>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>General details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="assetSelect" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-main)' }}>Asset *</label>
                <select 
                  id="assetSelect"
                  className="input" 
                  value={formData.assetId} 
                  onChange={(e) => handleChange('assetId', e.target.value)}
                  required
                  disabled={loadingAssets || initialAssetId}
                >
                  <option value="">Select an asset</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.assetCode} - {a.name} ({a.district})
                    </option>
                  ))}
                </select>
              </div>

              <Input 
                id="inspectedAt"
                label="Date and Time *"
                type="datetime-local"
                value={formData.inspectedAt}
                onChange={(e) => handleChange('inspectedAt', e.target.value)}
                required
                max={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Component conditions</h2>
            
            <ChecklistRadioGroup 
              label={isLand ? "Site Condition *" : "Building Condition *"}
              name="building_condition"
              value={formData.building_condition}
              onChange={(v) => handleChange('building_condition', v)}
            />

            {!isLand && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <ChecklistRadioGroup 
                  label="Electricity *"
                  name="electricity"
                  value={formData.electricity}
                  onChange={(v) => handleChange('electricity', v)}
                />
                <ChecklistRadioGroup 
                  label="Water *"
                  name="water"
                  value={formData.water}
                  onChange={(v) => handleChange('water', v)}
                />
                <ChecklistRadioGroup 
                  label="Plumbing *"
                  name="plumbing"
                  value={formData.plumbing}
                  onChange={(v) => handleChange('plumbing', v)}
                />
                <ChecklistRadioGroup 
                  label="Fire Safety *"
                  name="fire_safety"
                  value={formData.fire_safety}
                  onChange={(v) => handleChange('fire_safety', v)}
                />
              </div>
            )}

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Overall Condition Preview</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ConditionBadge condition={overallCondition} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-main)' }}>
                  {getDecidingSentence(overallCondition)}
                </span>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Remarks</h2>
            <div style={{ position: 'relative' }}>
              <textarea 
                className="input"
                rows={4}
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                maxLength={1000}
                placeholder="Add any specific notes or findings..."
                style={{ resize: 'vertical' }}
              />
              <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {formData.remarks.length} / 1000
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Attachments</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-weight-medium)', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Photos</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Upload up to 10 photos of the property condition.</p>
                <FileDropzone 
                  onDrop={handlePhotosDrop} 
                  accept=".jpg,.jpeg,.png,.webp" 
                  maxSize={5 * 1024 * 1024} 
                  maxFiles={10} 
                  label="Drop photos here or click to browse"
                />
                
                {photos.length > 0 && (
                  <div className="thumbnail-grid">
                    {photos.map((file, i) => (
                      <div key={i} className="thumbnail-item">
                        <img src={file.preview} alt={`Preview ${i+1}`} className="thumbnail-img" />
                        <button type="button" className="thumbnail-remove" onClick={() => removePhoto(i)} aria-label="Remove photo">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-weight-medium)', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Reports</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Upload up to 3 PDF reports.</p>
                <FileDropzone 
                  onDrop={handleReportsDrop} 
                  accept=".pdf" 
                  maxSize={10 * 1024 * 1024} 
                  maxFiles={3} 
                  label="Drop PDFs here or click to browse"
                />
                
                {reports.length > 0 && (
                  <div className="file-list">
                    {reports.map((file, i) => (
                      <div key={i} className="file-item">
                        <FileText className="file-item-icon" size={20} />
                        <div className="file-item-name" title={file.name}>{file.name}</div>
                        <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                        <button type="button" onClick={() => removeReport(i)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }} aria-label="Remove report">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Submit Inspection'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
