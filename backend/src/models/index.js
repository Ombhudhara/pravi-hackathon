import mongoose from 'mongoose';

const { Schema } = mongoose;

const baseOptions = {
  versionKey: false,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
};

function createModel(name, fields, options = {}) {
  const schema = new Schema({
    _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    ...fields
  }, { ...baseOptions, ...options });
  return mongoose.models[name] || mongoose.model(name, schema);
}

export const User = createModel('User', {
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'OFFICER', 'MAINTENANCE'], required: true, index: true },
  department: String,
  is_active: { type: Boolean, default: true },
  last_login_at: Date
});

export const Asset = createModel('Asset', {
  asset_code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['LAND', 'BUILDING', 'SCHOOL', 'PHC', 'OFFICE', 'COMMUNITY_HALL', 'WAREHOUSE', 'STAFF_QUARTERS'], required: true, index: true },
  department: { type: String, index: true },
  district: { type: String, required: true, index: true },
  taluka: String,
  village: String,
  survey_number: String,
  latitude: Number,
  longitude: Number,
  land_area_sqft: { type: Number, min: 0 },
  built_up_area_sqft: { type: Number, min: 0 },
  used_area_sqft: { type: Number, min: 0 },
  status: { type: String, enum: ['ACTIVE', 'VACANT', 'UNDER_MAINTENANCE', 'AVAILABLE', 'RETIRED', 'TRANSFERRED', 'DISPOSED'], required: true, index: true },
  condition: { type: String, enum: ['GOOD', 'NEEDS_ATTENTION', 'CRITICAL', 'NOT_APPLICABLE'], required: true, index: true },
  assigned_officer_id: { type: Schema.Types.ObjectId, index: true },
  created_by: Schema.Types.ObjectId
});

export const AssetEvent = createModel('AssetEvent', {
  asset_id: { type: Schema.Types.ObjectId, required: true, index: true },
  event_type: { type: String, required: true },
  description: String,
  performed_by: Schema.Types.ObjectId,
  event_date: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} }
});

export const Inspection = createModel('Inspection', {
  asset_id: { type: Schema.Types.ObjectId, required: true, index: true },
  inspector_id: Schema.Types.ObjectId,
  inspected_at: { type: Date, required: true, index: true },
  building_condition: String,
  electricity: String,
  water: String,
  plumbing: String,
  fire_safety: String,
  overall_condition: { type: String, index: true },
  remarks: String,
  status: String
});

export const MaintenanceIssue = createModel('MaintenanceIssue', {
  issue_code: { type: String, required: true, unique: true },
  asset_id: { type: Schema.Types.ObjectId, required: true, index: true },
  inspection_id: Schema.Types.ObjectId,
  title: { type: String, required: true },
  description: String,
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true, index: true },
  status: { type: String, enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'], required: true, index: true },
  assigned_department: String,
  assigned_to: { type: Schema.Types.ObjectId, index: true },
  reported_by: Schema.Types.ObjectId,
  resolved_at: Date
});

export const Attachment = createModel('Attachment', {
  entity_type: { type: String, required: true, index: true },
  entity_id: { type: Schema.Types.ObjectId, required: true, index: true },
  category: { type: String, required: true },
  original_name: { type: String, required: true },
  stored_name: { type: String, unique: true, sparse: true },
  file_path: String,
  mime_type: { type: String, required: true },
  size_bytes: { type: Number, required: true },
  uploaded_by: { type: Schema.Types.ObjectId, required: true }
});

export const IssueHistory = createModel('IssueHistory', {
  issue_id: { type: Schema.Types.ObjectId, required: true, index: true },
  from_status: String,
  to_status: { type: String, required: true },
  changed_by: Schema.Types.ObjectId,
  note: String
});

export const Counter = createModel('Counter', {
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 }
}, { timestamps: false });