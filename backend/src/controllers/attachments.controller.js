import fs from 'fs';
import path from 'path';
import * as attachmentsService from '../services/attachments.service.js';
import { config } from '../config/env.js';

export const downloadAttachment = async (req, res) => {
  try {
    const attachment = await attachmentsService.getAttachmentById(req.params.id);
    
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    const hasAccess = await attachmentsService.checkAttachmentAccess(
      attachment.entityType, 
      attachment.entityId, 
      req.user
    );

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const filePath = path.join(config.uploadDir, attachment.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk' });
    }

    const stat = fs.statSync(filePath);
    
    const isImage = attachment.mimeType.startsWith('image/');
    const inline = req.query.inline === '1';

    let disposition = 'attachment';
    if (isImage && inline) {
      disposition = 'inline';
    }

    // sanitize original name for header
    const sanitizedName = attachment.originalName.replace(/[^a-zA-Z0-9.-]/g, '_');

    res.writeHead(200, {
      'Content-Type': attachment.mimeType,
      'Content-Length': stat.size,
      'Content-Disposition': `${disposition}; filename="${sanitizedName}"`,
      'X-Content-Type-Options': 'nosniff'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
