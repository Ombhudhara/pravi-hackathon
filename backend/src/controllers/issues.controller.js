import * as issueService from '../services/issues.service.js';
import { Asset } from '../models/index.js';

export const getIssues = async (req, res, next) => {
  try {
    const { 
      search, status, priority, assetId, department, assignedTo, reportedBy, 
      dateFrom, dateTo, page, limit, sortBy, sortDir 
    } = req.query;

    const filters = { search, status, priority, assetId, department, assignedTo, reportedBy, dateFrom, dateTo };
    const p = parseInt(page, 10) || 1;
    const l = Math.min(parseInt(limit, 10) || 20, 100);

    const result = await issueService.getIssues(filters, req.user, p, l, sortBy || 'created_at', sortDir || 'desc');
    res.json({ success: true, message: 'Issues retrieved successfully', data: result });
  } catch (err) {
    next(err);
  }
};

export const getIssueById = async (req, res, next) => {
  try {
    const issue = await issueService.getIssueById(req.params.id, req.user);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found or unauthorized' });
    }
    res.json({ success: true, message: 'Issue retrieved successfully', data: issue });
  } catch (err) {
    next(err);
  }
};

export const createIssue = async (req, res, next) => {
  try {
    const data = req.body;
    
    if (!data.assetId || !data.title || !data.priority) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (data.title.length < 5 || data.title.length > 150) {
      return res.status(400).json({ success: false, message: 'Title must be between 5 and 150 characters' });
    }
    if (data.description && data.description.length > 1000) {
      return res.status(400).json({ success: false, message: 'Description must be under 1000 characters' });
    }

    const photos = req.files || [];
    if (photos.length > 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 photos allowed' });
    }

    if (req.user.role === 'OFFICER') {
      // Validate they have access to asset in service or here.
      // But we will just let service or earlier validation handle it, wait, we must check in service? Let's check here.
      const asset = await Asset.findById(data.assetId).select('assigned_officer_id').lean();
      if (!asset || String(asset.assigned_officer_id) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    if (req.user.role !== 'ADMIN') {
      data.assignedDepartment = undefined;
    }

    const result = await issueService.createIssue(data, req.user, photos);
    res.status(201).json({ success: true, message: 'Issue created successfully', data: result });
  } catch (err) {
    next(err);
  }
};

export const updateIssue = async (req, res, next) => {
  try {
    const issueId = req.params.id;
    const issue = await issueService.getIssueById(issueId, req.user);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found or unauthorized' });
    }

    const data = req.body;

    // Check permissions
    if (req.user.role === 'OFFICER') {
      if (issue.status !== 'OPEN') {
        return res.status(409).json({ success: false, message: 'Officers can only edit issues while OPEN' });
      }
      data.assignedDepartment = undefined;
      data.assignedTo = undefined;
    } else if (req.user.role === 'ADMIN') {
      if (data.priority && issue.status === 'VERIFIED') {
        return res.status(409).json({ success: false, message: 'Cannot edit priority of VERIFIED issues' });
      }
      if ((data.title || data.description || data.assignedDepartment !== undefined || data.assignedTo !== undefined) && 
          !['OPEN', 'ASSIGNED'].includes(issue.status)) {
        return res.status(409).json({ success: false, message: 'Can only edit title/description/assignment while OPEN or ASSIGNED' });
      }
    }

    await issueService.updateIssue(issueId, data, req.user);
    res.json({ success: true, message: 'Issue updated successfully' });
  } catch (err) {
    next(err);
  }
};

export const transitionIssue = async (req, res, next) => {
  try {
    const data = req.body;
    const evidences = req.files || [];

    if (!data.toStatus) {
      return res.status(400).json({ success: false, message: 'toStatus is required' });
    }

    if (evidences.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 completion evidence photos allowed' });
    }

    await issueService.transitionIssue(req.params.id, data, req.user, evidences);
    res.json({ success: true, message: `Issue transitioned to ${data.toStatus} successfully` });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export const getAssignees = async (req, res, next) => {
  try {
    const result = await issueService.getAssignees();
    res.json({ success: true, message: 'Assignees retrieved successfully', data: result });
  } catch (err) {
    next(err);
  }
};
