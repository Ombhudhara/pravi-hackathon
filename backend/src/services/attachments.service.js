import { Asset, Attachment, Inspection, MaintenanceIssue } from '../models/index.js';

export const getAttachmentById = async (id) => {
  const attachment = await Attachment.findById(id).lean();
  if (!attachment) return null;
  const { _id, entity_type, entity_id, original_name, stored_name, mime_type, size_bytes, uploaded_by, created_at, category } = attachment;
  return { id: _id, entityType: entity_type, entityId: entity_id, category, originalName: original_name, storedName: stored_name, mimeType: mime_type, sizeBytes: size_bytes, uploadedBy: uploaded_by, createdAt: created_at, filePath: attachment.file_path };
};

export const checkAttachmentAccess = async (entityType, entityId, user) => {
  if (user.role === 'ADMIN') return true;
  if (entityType === 'INSPECTION') {
    if (user.role === 'MAINTENANCE') return false;
    const inspection = await Inspection.findById(entityId).select('asset_id').lean();
    if (!inspection) return false;
    const asset = await Asset.findById(inspection.asset_id).select('assigned_officer_id').lean();
    return String(asset?.assigned_officer_id) === user.id;
  }
  if (entityType === 'ISSUE') {
    const issue = await MaintenanceIssue.findById(entityId).select('asset_id assigned_to assigned_department').lean();
    if (!issue) return false;
    const asset = await Asset.findById(issue.asset_id).select('assigned_officer_id').lean();
    if (user.role === 'OFFICER') return String(asset?.assigned_officer_id) === user.id;
    if (user.role === 'MAINTENANCE') return String(issue.assigned_to) === user.id || (!issue.assigned_to && issue.assigned_department === user.department);
  }
  return false;
};
