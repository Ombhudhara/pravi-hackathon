import { getDashboardSummary } from '../services/dashboard.service.js';

export const getSummary = async (req, res, next) => {
  try {
    const data = await getDashboardSummary(req.user);
    res.json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};
