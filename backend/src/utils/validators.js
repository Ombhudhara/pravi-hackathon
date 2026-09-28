export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidRole(role) {
  return ['ADMIN', 'OFFICER', 'MAINTENANCE'].includes(role);
}

export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid) || /^[0-9a-f]{24}$/i.test(uuid);
}

export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  // Minimum 10 characters, at least one letter and one number
  if (password.length < 10) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Validates a signup password against strict rules.
 * Returns an array of error messages (empty if valid).
 */
export function validateSignupPassword(password, email, fullName) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
    return errors;
  }
  if (password.length < 10) {
    errors.push('Password must be at least 10 characters.');
  }
  if (password.length > 72) {
    errors.push('Password must be at most 72 characters.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one symbol.');
  }
  // Check if password contains the email name part (before @)
  if (email && typeof email === 'string') {
    const emailName = email.split('@')[0].toLowerCase();
    if (emailName.length >= 3 && password.toLowerCase().includes(emailName)) {
      errors.push('Password must not contain your email username.');
    }
  }
  // Check if password contains the full name
  if (fullName && typeof fullName === 'string') {
    const trimmedName = fullName.trim().toLowerCase();
    if (trimmedName.length >= 3 && password.toLowerCase().includes(trimmedName)) {
      errors.push('Password must not contain your full name.');
    }
  }
  return errors;
}

/**
 * Full validation for signup request body.
 * Returns { errors } if invalid, { data } if valid.
 */
export function validateSignupBody(body) {
  const errors = {};

  // Full name
  if (!body.fullName || typeof body.fullName !== 'string') {
    errors.fullName = 'Full name is required.';
  } else {
    const trimmed = body.fullName.trim();
    if (trimmed.length < 3 || trimmed.length > 100) {
      errors.fullName = 'Full name must be between 3 and 100 characters.';
    } else if (!/^[A-Za-z\s.\-']+$/.test(trimmed)) {
      errors.fullName = 'Full name may contain only letters, spaces, dots, hyphens and apostrophes.';
    }
  }

  // Email
  if (!body.email || typeof body.email !== 'string') {
    errors.email = 'Email is required.';
  } else {
    const emailTrimmed = body.email.trim();
    if (emailTrimmed.length > 254) {
      errors.email = 'Email must be at most 254 characters.';
    } else if (!isValidEmail(emailTrimmed)) {
      errors.email = 'Please enter a valid email address.';
    }
  }

  // Department
  if (!body.department || typeof body.department !== 'string') {
    errors.department = 'Department is required.';
  } else {
    const deptTrimmed = body.department.trim();
    if (deptTrimmed.length < 2 || deptTrimmed.length > 100) {
      errors.department = 'Department must be between 2 and 100 characters.';
    }
  }

  // Requested role
  if (!body.requestedRole || typeof body.requestedRole !== 'string') {
    errors.requestedRole = 'Please select a role.';
  } else if (!['OFFICER', 'MAINTENANCE'].includes(body.requestedRole)) {
    errors.requestedRole = 'Requested role must be Officer or Maintenance.';
  }

  // Password
  const passwordErrors = validateSignupPassword(
    body.password,
    typeof body.email === 'string' ? body.email : '',
    typeof body.fullName === 'string' ? body.fullName : ''
  );
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors[0];
  }

  // Confirm password
  if (!body.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (body.password !== body.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  // Accept terms
  if (body.acceptTerms !== true) {
    errors.acceptTerms = 'You must accept the Terms and Conditions and Privacy Policy.';
  }

  // Build data only if no errors
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    data: {
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      department: body.department.trim(),
      requestedRole: body.requestedRole,
      password: body.password
    }
  };
}

/**
 * Rejects any body field that is not a plain string, number, or boolean.
 * Protects against MongoDB operator injection like { "$ne": "" }.
 */
export function rejectOperatorFields(body, fieldNames) {
  for (const field of fieldNames) {
    const val = body[field];
    if (val !== undefined && val !== null && typeof val === 'object') {
      return field;
    }
  }
  return null;
}

/**
 * Returns a list of unknown fields in the body that are not in allowedFields.
 */
export function findUnknownFields(body, allowedFields) {
  return Object.keys(body).filter(key => !allowedFields.includes(key));
}

const ASSET_TYPES = ['LAND', 'BUILDING', 'SCHOOL', 'PHC', 'OFFICE', 'COMMUNITY_HALL', 'WAREHOUSE', 'STAFF_QUARTERS'];
const ASSET_STATUSES = ['ACTIVE', 'VACANT', 'UNDER_MAINTENANCE', 'AVAILABLE', 'RETIRED', 'TRANSFERRED', 'DISPOSED'];
const ASSET_CONDITIONS = ['GOOD', 'NEEDS_ATTENTION', 'CRITICAL', 'NOT_APPLICABLE'];

export function validateAsset(body) {
  const errors = {};
  const data = {};

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3 || body.name.trim().length > 150) {
    errors.name = 'Name must be between 3 and 150 characters';
  } else {
    data.name = body.name.trim();
  }

  if (!ASSET_TYPES.includes(body.type)) {
    errors.type = 'Invalid asset type';
  } else {
    data.type = body.type;
  }

  if (!ASSET_STATUSES.includes(body.status)) {
    errors.status = 'Invalid asset status';
  } else {
    data.status = body.status;
  }

  if (body.type === 'LAND') {
    data.condition = 'NOT_APPLICABLE';
  } else {
    if (!ASSET_CONDITIONS.includes(body.condition)) {
      errors.condition = 'Invalid asset condition';
    } else {
      data.condition = body.condition;
    }
  }

  if (!body.district || typeof body.district !== 'string' || body.district.trim().length === 0) {
    errors.district = 'District is required';
  } else {
    data.district = body.district.trim();
  }

  ['taluka', 'village', 'department'].forEach(field => {
    if (body[field]) {
      if (typeof body[field] !== 'string' || body[field].trim().length > 100) {
        errors[field] = `${field} must be up to 100 characters`;
      } else {
        data[field] = body[field].trim();
      }
    } else {
      data[field] = null;
    }
  });

  if (body.type === 'LAND' && (!body.survey_number || body.survey_number.trim().length === 0)) {
    errors.survey_number = 'Survey number is required for LAND';
  } else if (body.survey_number) {
    if (typeof body.survey_number !== 'string' || body.survey_number.trim().length > 100) {
      errors.survey_number = 'Survey number must be up to 100 characters';
    } else {
      data.survey_number = body.survey_number.trim();
    }
  } else {
    data.survey_number = null;
  }

  if (body.latitude !== undefined && body.latitude !== null && body.latitude !== '') {
    const lat = Number(body.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    } else {
      data.latitude = lat;
    }
  } else {
    data.latitude = null;
  }

  if (body.longitude !== undefined && body.longitude !== null && body.longitude !== '') {
    const lng = Number(body.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    } else {
      data.longitude = lng;
    }
  } else {
    data.longitude = null;
  }

  if ((data.latitude !== null && data.longitude === null) || (data.latitude === null && data.longitude !== null)) {
    errors.coordinates = 'Both latitude and longitude must be provided, or neither';
  }

  ['land_area_sqft', 'built_up_area_sqft', 'used_area_sqft'].forEach(field => {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      const val = Number(body[field]);
      if (isNaN(val) || val < 0) {
        errors[field] = 'Must be a number greater than or equal to 0';
      } else {
        data[field] = Math.round(val * 100) / 100;
      }
    } else {
      data[field] = null;
    }
  });

  if (data.type === 'LAND') {
    if (data.used_area_sqft !== null && data.land_area_sqft !== null && data.used_area_sqft > data.land_area_sqft) {
      errors.used_area_sqft = 'Used area cannot exceed land area';
    }
  } else {
    if (data.used_area_sqft !== null && data.built_up_area_sqft !== null && data.used_area_sqft > data.built_up_area_sqft) {
      errors.used_area_sqft = 'Used area cannot exceed built up area';
    }
  }

  if (body.assigned_officer_id) {
    if (!isValidUUID(body.assigned_officer_id)) {
      errors.assigned_officer_id = 'Invalid assigned officer ID';
    } else {
      data.assigned_officer_id = body.assigned_officer_id;
    }
  } else {
    data.assigned_officer_id = null;
  }

  return Object.keys(errors).length > 0 ? { errors } : { data };
}

export function validateStatusChange(body) {
  const errors = {};
  const data = {};

  if (!ASSET_STATUSES.includes(body.status)) {
    errors.status = 'Invalid asset status';
  } else {
    data.status = body.status;
  }

  if (body.note) {
    if (typeof body.note !== 'string' || body.note.length > 300) {
      errors.note = 'Note must be up to 300 characters';
    } else {
      data.note = body.note.trim();
    }
  } else {
    data.note = null;
  }

  return Object.keys(errors).length > 0 ? { errors } : { data };
}

export function validateEventDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Event date must be in YYYY-MM-DD format');
  }

  // Use Intl to get current date in the configured timezone
  const tz = process.env.APP_TIMEZONE || 'Asia/Kolkata';
  const now = new Date();
  
  // Format current date to YYYY-MM-DD in the target timezone
  const parts = new Intl.DateTimeFormat('en-CA', { 
    timeZone: tz, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).formatToParts(now);
  
  const currentY = parts.find(p => p.type === 'year').value;
  const currentM = parts.find(p => p.type === 'month').value;
  const currentD = parts.find(p => p.type === 'day').value;
  
  const todayStr = `${currentY}-${currentM}-${currentD}`;

  if (dateStr > todayStr) {
    throw new Error('Event date cannot be in the future');
  }

  const [y, m, d] = dateStr.split('-');
  const eventYear = parseInt(y, 10);
  const currentYear = parseInt(currentY, 10);

  if (currentYear - eventYear > 100) {
    throw new Error('Event date cannot be more than 100 years in the past');
  }
}
