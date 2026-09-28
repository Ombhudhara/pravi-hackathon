import * as lifecycleService from '../services/lifecycle.service.js';
import { validateEventDate } from '../utils/validators.js';

export const getAssetEvents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const events = await lifecycleService.getAssetEvents(id, req.user);
    if (!events) {
      return res.status(404).json({ success: false, message: 'Asset not found or access denied' });
    }
    res.json({ success: true, message: 'Asset events retrieved successfully', data: events });
  } catch (err) {
    next(err);
  }
};

export const addAssetEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { eventType, eventDate, description } = req.body;

    if (!eventType || !eventDate || !description) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (description.length < 3 || description.length > 500) {
      return res.status(400).json({ success: false, message: 'Description must be between 3 and 500 characters' });
    }

    validateEventDate(eventDate);

    const allowedManualEvents = ['ACQUIRED', 'ALLOCATED', 'RE_ALLOCATED', 'NOTE'];
    if (!allowedManualEvents.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid event type for manual entry' });
    }

    if (req.user.role === 'OFFICER' && eventType !== 'NOTE') {
      return res.status(403).json({ success: false, message: 'Officers can only add NOTE events' });
    }

    const newEvent = await lifecycleService.addAssetEvent(id, { eventType, eventDate, description }, req.user);
    if (!newEvent) {
      return res.status(404).json({ success: false, message: 'Asset not found or access denied' });
    }

    res.status(201).json({ success: true, message: 'Asset event added successfully', data: newEvent });
  } catch (err) {
    next(err);
  }
};

export const getAssetLifecycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lifecycle = await lifecycleService.getAssetLifecycle(id, req.user);
    if (!lifecycle) {
      return res.status(404).json({ success: false, message: 'Asset not found or access denied' });
    }
    res.json({ success: true, message: 'Asset lifecycle retrieved successfully', data: lifecycle });
  } catch (err) {
    next(err);
  }
};

export const getGlobalEvents = async (req, res, next) => {
  try {
    const events = await lifecycleService.getGlobalEvents(req.query, req.user);
    res.json({ success: true, message: 'Global events retrieved successfully', data: events });
  } catch (err) {
    next(err);
  }
};
