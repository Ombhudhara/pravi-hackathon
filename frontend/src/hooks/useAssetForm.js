import { useState, useCallback } from 'react';

export default function useAssetForm(initialState) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear error for field if exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const resetForm = useCallback((newState = initialState) => {
    setFormData(newState);
    setErrors({});
    setIsDirty(false);
  }, [initialState]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    isDirty,
    setIsDirty,
    handleChange,
    resetForm
  };
}
