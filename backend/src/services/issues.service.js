import { Asset, AssetEvent, Attachment, Counter, Inspection, IssueHistory, MaintenanceIssue, User } from '../models/index.js';
import { isValidTransition } from '../utils/issueWorkflow.js';

const split = (value) => value?.split(',').map((item) => item.trim()).filter(Boolean) || [];
const ageDays = (start, end = new Date()) => Math.floor((end - start) / 86400000);

export const getIssues = async (filters = {}, user, page = 1, limit = 20, sortBy = 'created_at', sortDir = 'desc') => {
  page = Math.max(parseInt(page, 10) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const assets = await Asset.find(user.role === 'OFFICER' ? { assigned_officer_id: user.id } : {}).select('asset_code name district').lean();
  const assetById = new Map(assets.map((asset) => [asset._id, asset]));
  const filter = { asset_id: { $in: assets.map((asset) => asset._id) } };
  if (user.role === 'MAINTENANCE') filter.$or = [{ assigned_to: user.id }, { assigned_to: null, assigned_department: user.department }];
  if (filters.search) {
    const searchAssets = assets.filter((asset) => [asset.asset_code, asset.name].some((value) => value?.match(new RegExp(filters.search, 'i')))).map((asset) => asset._id);
    filter.$and = [{ $or: [{ issue_code: { $regex: filters.search, $options: 'i' } }, { title: { $regex: filters.search, $options: 'i' } }, { asset_id: { $in: searchAssets } }] }];
  }
  if (filters.status) filter.status = { $in: split(filters.status) };
  if (filters.priority) filter.priority = { $in: split(filters.priority) };
  for (const [field, value] of Object.entries({ asset_id: filters.assetId, assigned_department: filters.department, assigned_to: user.role === 'ADMIN' ? filters.assignedTo : undefined, reported_by: filters.reportedBy })) if (value) filter[field] = value;
  if (filters.dateFrom || filters.dateTo) filter.created_at = { ...(filters.dateFrom ? { $gte: new Date(filters.dateFrom) } : {}), ...(filters.dateTo ? { $lte: new Date(`${filters.dateTo}T23:59:59.999`) } : {}) };
  const allFiltered = await MaintenanceIssue.find(filter).sort({ [sortBy === 'priority' ? 'created_at' : ['status', 'issue_code', 'created_at'].includes(sortBy) ? sortBy : 'created_at']: sortDir.toLowerCase() === 'asc' ? 1 : -1 }).lean();
  const priorityRank = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
  if (sortBy === 'priority') allFiltered.sort((a, b) => (priorityRank[a.priority] - priorityRank[b.priority]) * (sortDir.toLowerCase() === 'asc' ? 1 : -1));
  const total = allFiltered.length;
  const rows = allFiltered.slice((page - 1) * limit, page * limit);
  const items = await Promise.all(rows.map(async (issue) => {
    const [asset, assigned, reporter] = await Promise.all([Promise.resolve(assetById.get(issue.asset_id) || null), issue.assigned_to ? User.findById(issue.assigned_to).select('full_name').lean() : null, issue.reported_by ? User.findById(issue.reported_by).select('full_name').lean() : null]);
    return { id: issue._id, issueCode: issue.issue_code, title: issue.title, priority: issue.priority, status: issue.status, assetId: issue.asset_id, assetCode: asset?.asset_code, assetName: asset?.name, district: asset?.district, assignedDepartment: issue.assigned_department, assignedTo: assigned ? { id: assigned._id, fullName: assigned.full_name } : null, reportedBy: reporter ? { id: reporter._id, fullName: reporter.full_name } : { id: issue.reported_by, fullName: null }, createdAt: issue.created_at, resolvedAt: issue.resolved_at, ageInDays: ageDays(issue.created_at, issue.resolved_at || new Date()) };
  }));
  const countFilter = { ...filter };
  delete countFilter.status;
  const counts = await MaintenanceIssue.aggregate([{ $match: countFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const statusCounts = { ALL: 0, OPEN: 0, ASSIGNED: 0, IN_PROGRESS: 0, RESOLVED: 0, VERIFIED: 0 };
  counts.forEach(({ _id, count }) => { statusCounts[_id] = count; statusCounts.ALL += count; });
  return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }, statusCounts };
};

export const getIssueById = async (id, user) => {
  const issue = await MaintenanceIssue.findById(id).lean();
  if (!issue) return null;
  const [asset, assigned, reporter, history, attachments] = await Promise.all([
    Asset.findById(issue.asset_id).lean(),
    issue.assigned_to ? User.findById(issue.assigned_to).select('full_name').lean() : null,
    issue.reported_by ? User.findById(issue.reported_by).select('full_name').lean() : null,
    IssueHistory.find({ issue_id: id }).sort({ created_at: -1 }).lean(),
    Attachment.find({ entity_type: 'ISSUE', entity_id: id }).sort({ created_at: 1 }).lean()
  ]);
  if (!asset || (user.role === 'OFFICER' && String(asset.assigned_officer_id) !== user.id) || (user.role === 'MAINTENANCE' && String(issue.assigned_to) !== user.id && !(issue.assigned_to == null && issue.assigned_department === user.department))) return null;
  const historyItems = await Promise.all(history.map(async (entry) => {
    const actor = entry.changed_by ? await User.findById(entry.changed_by).select('full_name').lean() : null;
    return { id: entry._id, fromStatus: entry.from_status, toStatus: entry.to_status, note: entry.note, createdAt: entry.created_at, changedByName: actor?.full_name };
  }));
  return { id: issue._id, issueCode: issue.issue_code, title: issue.title, description: issue.description, priority: issue.priority, status: issue.status, assetId: issue.asset_id, assetCode: asset.asset_code, assetName: asset.name, assetType: asset.type, assigned_officer_id: asset.assigned_officer_id, assignedDepartment: issue.assigned_department, assigned_to: issue.assigned_to, assignedToName: assigned?.full_name, reported_by: issue.reported_by, reportedByName: reporter?.full_name, inspectionId: issue.inspection_id, createdAt: issue.created_at, resolvedAt: issue.resolved_at, ageInDays: ageDays(issue.created_at, issue.resolved_at || new Date()), history: historyItems, attachments: attachments.map((entry) => ({ id: entry._id, originalName: entry.original_name, mimeType: entry.mime_type, sizeBytes: entry.size_bytes, category: entry.category, createdAt: entry.created_at })) };
};

export const createIssue = async (data, user, photos = []) => {
  const counter = await Counter.findOneAndUpdate({ name: 'issue-code' }, { $inc: { value: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  const issueCode = `ISS-${String(counter.value).padStart(6, '0')}`;
  const issue = await MaintenanceIssue.create({ issue_code: issueCode, asset_id: data.assetId, title: data.title, description: data.description || null, priority: data.priority, status: 'OPEN', reported_by: user.id, assigned_department: data.assignedDepartment || null, inspection_id: data.inspectionId || null });
  await IssueHistory.create({ issue_id: issue.id, from_status: null, to_status: 'OPEN', changed_by: user.id });
  await AssetEvent.create({ asset_id: data.assetId, event_type: 'ISSUE_REPORTED', performed_by: user.id, event_date: new Date(), metadata: { issueId: issue.id, issueCode, priority: data.priority } });
  for (const file of photos) await Attachment.create({ entity_type: 'ISSUE', entity_id: issue.id, file_path: file.path, original_name: file.originalname, mime_type: file.verifiedMimeType || file.mimetype, size_bytes: file.size, category: 'PHOTO', uploaded_by: user.id });
  return { id: issue.id, issueCode };
};

export const updateIssue = async (id, data, user) => {
  const changes = {};
  for (const field of ['title', 'description', 'priority']) if (data[field] !== undefined) changes[field] = data[field];
  if (data.assignedDepartment !== undefined && user.role === 'ADMIN') changes.assigned_department = data.assignedDepartment || null;
  if (data.assignedTo !== undefined && user.role === 'ADMIN') changes.assigned_to = data.assignedTo || null;
  if (!Object.keys(changes).length) return true;
  return Boolean(await MaintenanceIssue.findByIdAndUpdate(id, changes, { runValidators: true }));
};

export const transitionIssue = async (id, data, user, evidences = []) => {
  const { toStatus, note, assignedDepartment, assignedTo } = data;
  const issue = await MaintenanceIssue.findById(id);
  if (!issue) throw { status: 404, message: 'Issue not found' };
  const asset = await Asset.findById(issue.asset_id);
  if (!asset) throw { status: 404, message: 'Asset not found' };
  if (user.role === 'OFFICER' && String(asset.assigned_officer_id) !== user.id) throw { status: 403, message: 'Forbidden' };
  if (!isValidTransition(issue.status, toStatus, user.role, issue.assigned_to, user.id)) throw { status: 409, message: `Cannot transition issue from ${issue.status} to ${toStatus} with your role.` };
  if (toStatus === 'RESOLVED') {
    if (!await Attachment.exists({ entity_type: 'ISSUE', entity_id: id, category: 'COMPLETION_EVIDENCE' }) && !evidences.length) throw { status: 400, message: 'At least one completion evidence photo is required to resolve the issue.' };
    if (!note || note.length < 10 || note.length > 500) throw { status: 400, message: 'A resolution note between 10 and 500 characters is required.' };
  }
  if (toStatus === 'IN_PROGRESS' && issue.status === 'RESOLVED' && !note) throw { status: 400, message: 'A note is required when rejecting a repair.' };
  const fromStatus = issue.status;
  if (user.role === 'MAINTENANCE' && fromStatus === 'ASSIGNED' && toStatus === 'IN_PROGRESS' && !issue.assigned_to) issue.assigned_to = user.id;
  if (user.role === 'ADMIN') {
    if (assignedTo !== undefined) issue.assigned_to = assignedTo || null;
    if (assignedDepartment !== undefined) issue.assigned_department = assignedDepartment || null;
  }
  issue.status = toStatus;
  issue.resolved_at = toStatus === 'RESOLVED' ? new Date() : (toStatus === 'IN_PROGRESS' && fromStatus === 'RESOLVED' ? null : issue.resolved_at);
  await issue.save();
  await IssueHistory.create({ issue_id: id, from_status: fromStatus, to_status: toStatus, changed_by: user.id, note: note || null });
  for (const file of evidences) await Attachment.create({ entity_type: 'ISSUE', entity_id: id, file_path: file.path, original_name: file.originalname, mime_type: file.verifiedMimeType || file.mimetype, size_bytes: file.size, category: 'COMPLETION_EVIDENCE', uploaded_by: user.id });
  const event = async (eventType, metadata, description) => AssetEvent.create({ asset_id: asset.id, event_type: eventType, performed_by: user.id, event_date: new Date(), metadata, description });
  if (toStatus === 'IN_PROGRESS' && fromStatus !== 'RESOLVED') {
    await event('MAINTENANCE_STARTED', { issueId: id, issueCode: issue.issue_code });
    if (asset.status === 'ACTIVE') { asset.status = 'UNDER_MAINTENANCE'; await asset.save(); await event('STATUS_CHANGED', { fromStatus: 'ACTIVE', toStatus: 'UNDER_MAINTENANCE' }, 'Asset status set by maintenance workflow'); }
  } else if (toStatus === 'RESOLVED') await event('MAINTENANCE_COMPLETED', { issueId: id, issueCode: issue.issue_code });
  else if (toStatus === 'VERIFIED') {
    await event('ISSUE_VERIFIED', { issueId: id, issueCode: issue.issue_code });
    if (asset.status === 'UNDER_MAINTENANCE' && !await MaintenanceIssue.exists({ asset_id: asset.id, _id: { $ne: id }, status: { $in: ['IN_PROGRESS', 'RESOLVED'] } })) { asset.status = 'ACTIVE'; await asset.save(); await event('STATUS_CHANGED', { fromStatus: 'UNDER_MAINTENANCE', toStatus: 'ACTIVE' }, 'Asset status restored by maintenance workflow'); }
  }
  return true;
};

export const getAssignees = async () => {
  const users = await User.find({ role: 'MAINTENANCE', is_active: true }).select('full_name department').sort({ full_name: 1 }).lean();
  return { users: users.map(({ _id, full_name, department }) => ({ id: _id, fullName: full_name, department })), departments: [...new Set(users.map(({ department }) => department).filter(Boolean))].sort() };
};
