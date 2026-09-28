import { getEnums as getEnumsService } from '../services/dashboard.service.js';

export const getEnums = (req, res, next) => {
  try {
    const data = getEnumsService();
    res.json({
      success: true,
      message: 'System enumerations retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};
