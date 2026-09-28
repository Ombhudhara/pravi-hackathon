import { Asset, AssetEvent, Attachment, Inspection, MaintenanceIssue, User } from '../models/index.js';
import { calculateOverallCondition } from '../utils/condition.js';

const asId = (doc) => doc?._id;

export const getInspections = async ({ assetId, inspectorId, overallCondition, type, district, dateFrom, dateTo, page = 1, limit = 20, sortBy = 'inspected_at', sortDir = 'desc' }) => {
  const assetFilter = {};
  if (type) assetFilter.type = type;
  if (district) assetFilter.district = district;
  const assets = await Asset.find(assetFilter).select('asset_code name district').lean();
  const assetById = new Map(assets.map((asset) => [asset._id, asset]));
  const filter = { asset_id: { $in: assets.map(asId) } };
  if (assetId) filter.asset_id = assetId;
  if (inspectorId) filter.inspector_id = inspectorId;
  if (overallCondition) filter.overall_condition = { $in: overallCondition.split(',').map((value) => value.trim()) };
  if (dateFrom || dateTo) filter.inspected_at = { ...(dateFrom ? { $gte: new Date(dateFrom) } : {}), ...(dateTo ? { $lte: new Date(dateTo) } : {}) };
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 20), 100);
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const sortField = ['inspected_at', 'overall_condition'].includes(sortBy) ? sortBy : 'inspected_at';
  const direction = sortDir.toLowerCase() === 'asc' ? 1 : -1;
  const [total, inspections] = await Promise.all([Inspection.countDocuments(filter), Inspection.find(filter).sort({ [sortField]: direction }).skip((pageNum - 1) * safeLimit).limit(safeLimit).lean()]);
  const items = await Promise.all(inspections.map(async (inspection) => {
    const asset = assetById.get(inspection.asset_id) || await Asset.findById(inspection.asset_id).select('asset_code name district').lean();
    const inspector = inspection.inspector_id ? await User.findById(inspection.inspector_id).select('full_name').lean() : null;
    const [attachmentCount, issueCount] = await Promise.all([Attachment.countDocuments({ entity_type: 'INSPECTION', entity_id: inspection._id }), MaintenanceIssue.countDocuments({ inspection_id: inspection._id })]);
    return { id: inspection._id, assetId: inspection.asset_id, assetCode: asset?.asset_code, assetName: asset?.name, district: asset?.district, inspectorName: inspector?.full_name, inspectedAt: inspection.inspected_at, overallCondition: inspection.overall_condition, attachmentCount, issueCount };
  }));
  return { items, pagination: { page: pageNum, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
};

export const getInspectionById = async (id, userId, userRole) => {
  const inspection = await Inspection.findById(id).lean();
  if (!inspection) return null;
  const [asset, inspector] = await Promise.all([Asset.findById(inspection.asset_id).lean(), inspection.inspector_id ? User.findById(inspection.inspector_id).select('full_name').lean() : null]);
  if (!asset) return null;
  if (userRole === 'OFFICER' && String(asset.assigned_officer_id) !== String(userId)) { const error = new Error('Not authorized to view this inspection'); error.status = 404; throw error; }
  const [attachments, issues] = await Promise.all([Attachment.find({ entity_type: 'INSPECTION', entity_id: id }).select('category original_name mime_type size_bytes').lean(), MaintenanceIssue.find({ inspection_id: id }).sort({ created_at: -1 }).select('issue_code title priority status created_at').lean()]);
  return { id: inspection._id, assetId: asset._id, assetCode: asset.asset_code, assetName: asset.name, assetType: asset.type, district: asset.district, assignedOfficerId: asset.assigned_officer_id, inspectorId: inspection.inspector_id, inspectorName: inspector?.full_name, inspectedAt: inspection.inspected_at, buildingCondition: inspection.building_condition, electricity: inspection.electricity, water: inspection.water, plumbing: inspection.plumbing, fireSafety: inspection.fire_safety, overallCondition: inspection.overall_condition, remarks: inspection.remarks, createdAt: inspection.created_at, attachments: attachments.map(({ _id, category, original_name, mime_type, size_bytes }) => ({ id: _id, category, originalName: original_name, mimeType: mime_type, sizeBytes: size_bytes })), linkedIssues: issues.map(({ _id, issue_code, title, priority, status, created_at }) => ({ id: _id, issueCode: issue_code, title, priority, status, createdAt: created_at })) };
};

export const getInspectionsByAssetId = async (assetId) => {
  const inspections = await Inspection.find({ asset_id: assetId }).sort({ inspected_at: -1 }).lean();
  return Promise.all(inspections.map(async (inspection) => {
    const [inspector, attachmentCount] = await Promise.all([inspection.inspector_id ? User.findById(inspection.inspector_id).select('full_name').lean() : null, Attachment.countDocuments({ entity_type: 'INSPECTION', entity_id: inspection._id })]);
    return { id: inspection._id, inspectorName: inspector?.full_name, inspectedAt: inspection.inspected_at, overallCondition: inspection.overall_condition, remarks: inspection.remarks, attachmentCount };
  }));
};

export const createInspection = async (data, files = []) => {
  const asset = await Asset.findById(data.assetId);
  if (!asset) throw new Error('Asset not found');
  let { building_condition, electricity, water, plumbing, fire_safety } = data;
  if (asset.type === 'LAND') electricity = water = plumbing = fire_safety = 'NOT_APPLICABLE';
  const overall_condition = calculateOverallCondition({ building_condition, electricity, water, plumbing, fire_safety });
  const inspection = await Inspection.create({ asset_id: data.assetId, inspector_id: data.inspectorId, inspected_at: data.inspectedAt || new Date(), building_condition, electricity, water, plumbing, fire_safety, overall_condition, remarks: data.remarks, status: 'COMPLETED' });
  for (const file of files) {
    const category = file.fieldname === 'photos' ? 'PHOTO' : file.fieldname === 'reports' ? 'REPORT' : 'DOCUMENT';
    await Attachment.create({ entity_type: 'INSPECTION', entity_id: inspection.id, category, original_name: file.originalname.slice(0, 255), stored_name: file.filename, mime_type: file.verifiedMimeType || file.mimetype, size_bytes: file.size, uploaded_by: data.inspectorId });
  }
  asset.condition = overall_condition;
  await asset.save();
  const conditionDesc = overall_condition.replace('_', ' ').toLowerCase();
  await AssetEvent.create({ asset_id: asset.id, event_type: 'INSPECTED', description: `Inspection completed, overall condition ${conditionDesc.charAt(0).toUpperCase()}${conditionDesc.slice(1)}`, performed_by: data.inspectorId, event_date: new Date(), metadata: { inspectionId: inspection.id, overallCondition: overall_condition } });
  return { id: inspection.id, overall_condition: inspection.overall_condition };
};
