import * as analyticsService from '../services/analytics.service.js';

export const getUtilization = async (req, res, next) => {
  try {
    const data = await analyticsService.getUtilizationAnalytics(req.user, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getCondition = async (req, res, next) => {
  try {
    const data = await analyticsService.getConditionAnalytics(req.user, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getMaintenance = async (req, res, next) => {
  try {
    const data = await analyticsService.getMaintenanceAnalytics(req.user, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getInspections = async (req, res, next) => {
  try {
    const data = await analyticsService.getInspectionsAnalytics(req.user, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const { report } = req.query;
    if (!report) {
      return res.status(400).json({ success: false, message: 'Report type is required' });
    }
    
    const csvData = await analyticsService.exportAnalytics(req.user, report, req.query);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${report}-report-${dateStr}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};
