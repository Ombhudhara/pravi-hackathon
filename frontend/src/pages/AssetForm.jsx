import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useAssetForm from '../hooks/useAssetForm';
import { getAssetById, createAsset, updateAsset } from '../services/assets';
import { ASSET_TYPES, ASSET_STATUSES, ASSET_CONDITIONS } from '../config/labels';
import MapPicker from '../components/MapPicker';
import { MapPin } from 'lucide-react';

const initialAssetData = {
  name: '',
  type: 'LAND',
  status: 'ACTIVE',
  condition: 'NOT_APPLICABLE',
  district: '',
  taluka: '',
  village: '',
  survey_number: '',
  department: '',
  land_area_sqft: '',
  built_up_area_sqft: '',
  used_area_sqft: '',
  latitude: '',
  longitude: '',
  assigned_officer_id: ''
};

export default function AssetForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  useDocumentTitle(isEdit ? 'Edit Asset' : 'Add Asset');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const { formData, setFormData, errors, handleChange } = useAssetForm(initialAssetData);

  useEffect(() => {
    if (isEdit) {
      getAssetById(id).then(res => {
        if (res.success) {
          const d = res.data;
          setFormData({
            name: d.name || '',
            type: d.type || 'LAND',
            status: d.status || 'ACTIVE',
            condition: d.condition || 'NOT_APPLICABLE',
            district: d.district || '',
            taluka: d.taluka || '',
            village: d.village || '',
            survey_number: d.survey_number || '',
            department: d.department || '',
            land_area_sqft: d.land_area_sqft ?? '',
            built_up_area_sqft: d.built_up_area_sqft ?? '',
            used_area_sqft: d.used_area_sqft ?? '',
            latitude: d.latitude ?? '',
            longitude: d.longitude ?? '',
            assigned_officer_id: d.assigned_officer_id || ''
          });
        }
      }).catch(err => {
        setSubmitError(err.message || 'Failed to fetch asset');
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, isEdit, setFormData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError(null);
    try {
      if (isEdit) {
        await updateAsset(id, formData);
      } else {
        await createAsset(formData);
      }
      navigate('/app/assets');
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleChange('latitude', pos.coords.latitude.toFixed(6));
          handleChange('longitude', pos.coords.longitude.toFixed(6));
        },
        (err) => {
          alert('Could not get location. Please ensure location services are enabled.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleLocationSelect = (lat, lng) => {
    handleChange('latitude', lat ? lat.toFixed(6) : '');
    handleChange('longitude', lng ? lng.toFixed(6) : '');
  };

  const getOptions = (obj) => Object.entries(obj).map(([k, v]) => ({ value: k, label: v }));

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading asset data...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader 
        title={isEdit ? 'Edit Asset' : 'Add Asset'} 
        description={isEdit ? 'Update details for this property.' : 'Register a new property in the system.'}
      />

      <Card>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {submitError && (
            <div className="alert alert-danger" style={{ backgroundColor: 'var(--color-status-red-bg)', color: 'var(--color-status-red)' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <Input 
              id="name"
              label="Asset Name *"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              required
              maxLength={150}
            />
            
            <Select
              id="type"
              label="Asset Type *"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              options={getOptions(ASSET_TYPES)}
              error={errors.type}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Select
              id="status"
              label="Status *"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={getOptions(ASSET_STATUSES)}
              error={errors.status}
              required
            />
            
            <Select
              id="condition"
              label="Condition"
              value={formData.condition}
              onChange={(e) => handleChange('condition', e.target.value)}
              options={getOptions(ASSET_CONDITIONS)}
              error={errors.condition}
              disabled={formData.type === 'LAND'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input 
              id="district"
              label="District *"
              value={formData.district}
              onChange={(e) => handleChange('district', e.target.value)}
              error={errors.district}
              required
              maxLength={100}
            />
            <Input 
              id="taluka"
              label="Taluka"
              value={formData.taluka}
              onChange={(e) => handleChange('taluka', e.target.value)}
              error={errors.taluka}
              maxLength={100}
            />
            <Input 
              id="village"
              label="Village"
              value={formData.village}
              onChange={(e) => handleChange('village', e.target.value)}
              error={errors.village}
              maxLength={100}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <Input 
              id="survey_number"
              label={formData.type === 'LAND' ? 'Survey Number *' : 'Survey Number'}
              value={formData.survey_number}
              onChange={(e) => handleChange('survey_number', e.target.value)}
              error={errors.survey_number}
              required={formData.type === 'LAND'}
              maxLength={100}
            />
            <Input 
              id="department"
              label="Department"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              error={errors.department}
              maxLength={100}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Input 
              id="land_area_sqft"
              label="Land Area (sq ft)"
              type="number"
              min="0"
              step="any"
              value={formData.land_area_sqft}
              onChange={(e) => handleChange('land_area_sqft', e.target.value)}
              error={errors.land_area_sqft}
            />
            <Input 
              id="built_up_area_sqft"
              label="Built Up Area (sq ft)"
              type="number"
              min="0"
              step="any"
              value={formData.built_up_area_sqft}
              onChange={(e) => handleChange('built_up_area_sqft', e.target.value)}
              error={errors.built_up_area_sqft}
              disabled={formData.type === 'LAND'}
            />
            <Input 
              id="used_area_sqft"
              label="Used Area (sq ft)"
              type="number"
              min="0"
              step="any"
              value={formData.used_area_sqft}
              onChange={(e) => handleChange('used_area_sqft', e.target.value)}
              error={errors.used_area_sqft}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <Input 
              id="latitude"
              label="Latitude"
              type="number"
              min="-90"
              max="90"
              step="any"
              value={formData.latitude}
              onChange={(e) => handleChange('latitude', e.target.value)}
              error={errors.latitude}
            />
            <Input 
              id="longitude"
              label="Longitude"
              type="number"
              min="-180"
              max="180"
              step="any"
              value={formData.longitude}
              onChange={(e) => handleChange('longitude', e.target.value)}
              error={errors.longitude}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-main)' }}>Location on Map</label>
              <button 
                type="button" 
                className="button button-secondary" 
                onClick={handleGetCurrentLocation}
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <MapPin size={12} /> Use my current location
              </button>
            </div>
            <MapPicker 
              latitude={formData.latitude ? parseFloat(formData.latitude) : null} 
              longitude={formData.longitude ? parseFloat(formData.longitude) : null}
              onLocationSelect={handleLocationSelect}
            />
          </div>
          
          <Input 
            id="assigned_officer_id"
            label="Assigned Officer ID"
            value={formData.assigned_officer_id}
            onChange={(e) => handleChange('assigned_officer_id', e.target.value)}
            error={errors.assigned_officer_id}
            placeholder="UUID of officer"
          />

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={() => navigate('/app/assets')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Asset')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
