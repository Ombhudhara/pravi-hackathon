import * as assetsService from '../services/assets.service.js';
import * as inspectionsService from '../services/inspections.service.js';
import { validateAsset, validateStatusChange } from '../utils/validators.js';

export const getAssets = async (req, res, next) => {
  try {
    const result = await assetsService.getAssets(req.query, req.user);
    res.json({ success: true, message: 'Assets retrieved successfully', data: result });
  } catch (error) {
    next(error);
  }
};

export const getAssetFilters = async (req, res, next) => {
  try {
    const result = await assetsService.getAssetFilters(req.user);
    res.json({ success: true, message: 'Filters retrieved successfully', data: result });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req, res, next) => {
  try {
    const result = await assetsService.getAssetById(req.params.id, req.user);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset retrieved successfully', data: result });
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req, res, next) => {
  try {
    const { errors, data } = validateAsset(req.body);
    if (errors) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    const result = await assetsService.createAsset(data, req.user);
    res.status(201).json({ success: true, message: 'Asset created successfully', data: result });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const { errors, data } = validateAsset(req.body);
    if (errors) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    const result = await assetsService.updateAsset(req.params.id, data, req.user);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset updated successfully', data: result });
  } catch (error) {
    next(error);
  }
};

export const changeAssetStatus = async (req, res, next) => {
  try {
    const { errors, data } = validateStatusChange(req.body);
    if (errors) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    const result = await assetsService.changeAssetStatus(req.params.id, data, req.user);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Asset not found or unauthorized' });
    }
    res.json({ success: true, message: 'Asset status updated successfully', data: result });
  } catch (error) {
    // If specific error thrown for invalid status
    if (error.message.includes('not allowed')) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getAssetInspections = async (req, res, next) => {
  try {
    // Check if user can view asset
    const asset = await assetsService.getAssetById(req.params.id, req.user);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    
    if (req.user.role === 'MAINTENANCE') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const inspections = await inspectionsService.getInspectionsByAssetId(req.params.id);
    res.json({ success: true, data: inspections });
  } catch (error) {
    next(error);
  }
};

export const getAssetIssues = async (req, res, next) => {
  try {
    const assetId = req.params.id;
    // Check scoping
    if (req.user.role === 'OFFICER') {
      const asset = await assetsService.getAssetById(assetId, req.user);
      if (!asset || String(asset.assigned_officer_id) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    // Reuse the issues service
    const issueService = await import('../services/issues.service.js');
    const result = await issueService.getIssues({ assetId }, req.user, 1, 100);
    res.json({ success: true, message: 'Asset issues retrieved', data: result.items });
  } catch (error) {
    next(error);
  }
};
