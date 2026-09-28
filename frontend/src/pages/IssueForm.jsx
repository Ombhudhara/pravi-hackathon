import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { AlertCircle, Save, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import FileDropzone from '../components/FileDropzone';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function IssueForm() {
  useDocumentTitle('Report Issue');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [searchParams] = useSearchParams();
  
  const initialAssetId = searchParams.get('assetId') || '';
  const initialInspectionId = searchParams.get('inspectionId') || '';

  const [formData, setFormData] = useState({
    assetId: initialAssetId,
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedDepartment: '',
    inspectionId: initialInspectionId
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Options
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Fetch assets for combo
    api.get('/assets?limit=1000') // In real app, use autocomplete combobox
      .then(res => setAssets(res.data.items || []))
      .catch(console.error);
      
    api.get('/issues/assignees')
      .then(res => setDepartments(res.data.data.departments || []))
      .catch(console.error);

    if (isEditing) {
      setLoading(true);
      api.get(`/issues/${id}`)
        .then(res => {
          const data = res.data.data;
          setFormData({
            assetId: data.assetId,
            title: data.title,
            description: data.description || '',
            priority: data.priority,
            assignedDepartment: data.assignedDepartment || '',
            inspectionId: data.inspectionId || ''
          });
          setLoading(false);
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to load issue');
          setLoading(false);
        });
    }
  }, [user.role, isEditing, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotosChange = (files) => {
    setPhotos(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.title || !formData.priority) {
      setError('Please fill in all required fields.');
      return;
    }
    if (formData.title.length < 5 || formData.title.length > 150) {
      setError('Title must be between 5 and 150 characters.');
      return;
    }
    if (formData.description && formData.description.length > 1000) {
      setError('Description must be under 1000 characters.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing) {
        const updateData = {
          title: formData.title,
          priority: formData.priority,
          description: formData.description,
          assignedDepartment: formData.assignedDepartment
        };
        const res = await api.put(`/issues/${id}`, updateData);
        if (res.data.success) {
          navigate(`/app/maintenance/${id}`);
        } else {
          throw new Error(res.data.message);
        }
      } else {
        const submitData = new FormData();
        submitData.append('assetId', formData.assetId);
        submitData.append('title', formData.title);
        submitData.append('priority', formData.priority);
        if (formData.description) submitData.append('description', formData.description);
        if (formData.inspectionId) submitData.append('inspectionId', formData.inspectionId);
        if (user.role === 'ADMIN' && formData.assignedDepartment) {
          submitData.append('assignedDepartment', formData.assignedDepartment);
        }

        photos.forEach(file => {
          submitData.append('photos', file);
        });

        const res = await api.post('/issues', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
          navigate(`/app/maintenance/${res.data.data.id}`);
        } else {
          throw new Error(res.data.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (formData.title || formData.description) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData]);

  return (
    <div className="page-container max-w-3xl">
      <PageHeader 
        title={isEditing ? 'Edit Issue' : 'Report Issue'} 
        description={isEditing ? 'Update maintenance issue details.' : 'Log a new maintenance issue for an asset.'}
        backTo={isEditing ? `/app/maintenance/${id}` : "/app/maintenance"}
      />

      {error && (
        <div className="error-alert mb-4">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label required">Asset</label>
            <select 
              className="form-select" 
              name="assetId" 
              value={formData.assetId} 
              onChange={handleChange}
              disabled={isEditing}
              required
            >
              <option value="" disabled>Select an asset...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.assetCode} - {a.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-4">
            <Input
              label="Issue Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g., Leaking pipe in main hall"
              required
              maxLength={150}
              helpText="Provide a brief summary of the issue (5 to 150 characters)."
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows={4}
              maxLength={1000}
            />
            <div className="form-help text-right">
              {formData.description.length}/1000 characters
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label required">Priority</label>
            <div className="checklist-radio-group">
              {[
                { value: 'CRITICAL', label: 'Critical', desc: 'Immediate safety or operational risk' },
                { value: 'HIGH', label: 'High', desc: 'Severe impact on operations' },
                { value: 'MEDIUM', label: 'Medium', desc: 'Moderate impact, can be scheduled' },
                { value: 'LOW', label: 'Low', desc: 'Minor issue or cosmetic' }
              ].map(opt => (
                <label key={opt.value} className={`checklist-radio-item ${formData.priority === opt.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={opt.value}
                    checked={formData.priority === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="checklist-radio-content">
                    <div className="checklist-radio-title">{opt.label}</div>
                    <div className="checklist-radio-desc">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label">Assign to Department (Optional)</label>
            <select 
              className="form-select" 
              name="assignedDepartment" 
              value={formData.assignedDepartment} 
              onChange={handleChange}
            >
              <option value="">Leave Unassigned</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {!isEditing && (
            <div className="form-group mb-8">
              <label className="form-label">Photos (Optional)</label>
              <FileDropzone 
                onFilesSelected={handlePhotosChange}
                maxFiles={5}
                accept="image/*"
                maxSizeMB={5}
                helpText="Upload up to 5 photos showing the issue."
              />
            </div>
          )}

          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} isLoading={loading}>
              {isEditing ? 'Save Changes' : 'Submit Issue'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
