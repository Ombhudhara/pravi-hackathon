import * as inspectionsService from '../services/inspections.service.js';
import { cleanupFiles } from '../middlewares/uploads.js';

export const getInspections = async (req, res) => {
  try {
    const filters = { ...req.query };
    
    // Scoping
    if (req.user.role === 'OFFICER') {
      filters.assignedOfficerId = req.user.id;
    } else if (req.user.role === 'MAINTENANCE') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await inspectionsService.getInspections(filters);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInspectionById = async (req, res) => {
  try {
    if (req.user.role === 'MAINTENANCE') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = await inspectionsService.getInspectionById(req.params.id, req.user.id, req.user.role);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Inspection not found' });
    }
    
    res.json({ success: true, data });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInspection = async (req, res) => {
  try {
    if (req.user.role === 'MAINTENANCE') {
      await cleanupFiles(req);
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const data = { ...req.body, inspectorId: req.user.id };
    
    // Check asset scope
    if (req.user.role === 'OFFICER') {
       // Ideally verify asset is assigned to OFFICER, maybe inside service or here
       // We can just try to fetch the asset to verify
    }

    const files = [];
    if (req.files) {
      if (req.files['photos']) files.push(...req.files['photos']);
      if (req.files['reports']) files.push(...req.files['reports']);
    }

    const inspection = await inspectionsService.createInspection(data, files);
    
    res.status(201).json({ success: true, data: inspection });
  } catch (error) {
    await cleanupFiles(req);
    res.status(400).json({ success: false, message: error.message });
  }
};
