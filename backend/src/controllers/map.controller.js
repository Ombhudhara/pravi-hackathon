import * as mapService from '../services/map.service.js';

export const getMapAssets = async (req, res, next) => {
  try {
    const data = await mapService.getMapAssets(req.query, req.user);
    res.json({
      success: true,
      message: 'Map assets retrieved successfully',
      data
    });
  } catch (error) {
    next(error);
  }
};
