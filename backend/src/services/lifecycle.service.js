import { Asset, AssetEvent, User } from '../models/index.js';
import { determineLifecycleStages } from '../utils/lifecycle.js';

export const getAssetEvents = async (assetId, user) => {
  const asset = await Asset.findById(assetId).lean();
  if (!asset || (user.role === 'OFFICER' && String(asset.assigned_officer_id) !== user.id)) return null;
  const events = await AssetEvent.find({ asset_id: assetId }).sort({ event_date: -1, created_at: -1 }).lean();
  return Promise.all(events.map(async (event) => {
    const actor = event.performed_by ? await User.findById(event.performed_by).select('full_name role').lean() : null;
    return { id: event._id, eventType: event.event_type, description: event.description, eventDate: event.event_date, metadata: event.metadata || {}, performedBy: actor ? { id: actor._id, fullName: actor.full_name, role: actor.role } : null };
  }));
};

export const addAssetEvent = async (assetId, data, user) => {
  const asset = await Asset.findById(assetId).lean();
  if (!asset || (user.role === 'OFFICER' && String(asset.assigned_officer_id) !== user.id)) return null;
  const event = await AssetEvent.create({ asset_id: assetId, event_type: data.eventType, description: data.description, performed_by: user.id, event_date: data.eventDate, metadata: {} });
  return { id: event.id, eventType: event.event_type, description: event.description, eventDate: event.event_date, metadata: event.metadata, performedBy: { id: user.id, fullName: user.full_name, role: user.role } };
};

export const getAssetLifecycle = async (assetId, user) => {
  const asset = await Asset.findById(assetId).lean();
  if (!asset || (user.role === 'OFFICER' && String(asset.assigned_officer_id) !== user.id)) return null;
  const events = await AssetEvent.find({ asset_id: assetId }).sort({ event_date: 1 }).lean();
  return determineLifecycleStages(asset.status, events.map(({ event_type, event_date, metadata }) => ({ event_type, event_date, metadata })));
};

export const getGlobalEvents = async (query, user) => {
  const { eventType, dateFrom, dateTo, district, search, assetId } = query;
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 25, 1), 100);
  const assetFilter = {};
  if (user.role === 'OFFICER') assetFilter.assigned_officer_id = user.id;
  if (district) assetFilter.district = district;
  if (search) assetFilter.$or = [{ asset_code: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }];
  const assets = await Asset.find(assetFilter).select('asset_code name district').lean();
  const assetIds = assets.map((asset) => asset._id);
  const filter = { asset_id: { $in: assetIds } };
  if (assetId) filter.asset_id = assetId;
  if (eventType) filter.event_type = { $in: eventType.split(',').map((type) => type.trim()).filter(Boolean) };
  if (dateFrom || dateTo) filter.event_date = { ...(dateFrom ? { $gte: new Date(dateFrom) } : {}), ...(dateTo ? { $lte: new Date(dateTo) } : {}) };
  const total = await AssetEvent.countDocuments(filter);
  const events = await AssetEvent.find(filter).sort({ event_date: -1, created_at: -1 }).skip((page - 1) * limit).limit(limit).lean();
  const assetById = new Map(assets.map((asset) => [asset._id, asset]));
  const items = await Promise.all(events.map(async (event) => {
    const asset = assetById.get(event.asset_id) || await Asset.findById(event.asset_id).select('asset_code name district').lean();
    const actor = event.performed_by ? await User.findById(event.performed_by).select('full_name role').lean() : null;
    return { id: event._id, eventType: event.event_type, description: event.description, eventDate: event.event_date, assetId: event.asset_id, assetCode: asset?.asset_code, assetName: asset?.name, district: asset?.district, performedBy: actor ? { id: actor._id, fullName: actor.full_name, role: actor.role } : null };
  }));
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
