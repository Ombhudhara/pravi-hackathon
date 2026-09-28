import fs from 'fs/promises';
import { fileTypeFromFile } from 'file-type';

export const verifyFiles = async (req, res, next) => {
  try {
    const files = [];
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        for (const key in req.files) {
          files.push(...req.files[key]);
        }
      }
    } else if (req.file) {
      files.push(req.file);
    }

    if (files.length === 0) {
      return next();
    }

    const maxPhotoSize = 5 * 1024 * 1024; // 5 MB
    const maxPdfSize = 10 * 1024 * 1024; // 10 MB
    
    // Check files and magic bytes
    for (const file of files) {
      const isPhoto = file.fieldname === 'photos';
      const isReport = file.fieldname === 'reports';
      
      if (isPhoto && file.size > maxPhotoSize) {
        throw new Error(`Photo ${file.originalname} exceeds 5 MB limit.`);
      }
      if (isReport && file.size > maxPdfSize) {
        throw new Error(`Report ${file.originalname} exceeds 10 MB limit.`);
      }

      const meta = await fileTypeFromFile(file.path);
      
      if (!meta) {
        throw new Error(`Could not determine file type for ${file.originalname}.`);
      }

      if (isPhoto) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(meta.mime)) {
          throw new Error(`Photo ${file.originalname} has invalid type ${meta.mime}. Only JPEG, PNG, WEBP allowed.`);
        }
      }

      if (isReport) {
        if (meta.mime !== 'application/pdf') {
          throw new Error(`Report ${file.originalname} has invalid type ${meta.mime}. Only PDF allowed.`);
        }
      }

      // Store actual verified mime type
      file.verifiedMimeType = meta.mime;
    }

    // Counts verification
    if (req.files) {
      const photosCount = req.files['photos'] ? req.files['photos'].length : 0;
      const reportsCount = req.files['reports'] ? req.files['reports'].length : 0;
      
      if (photosCount > 10) {
        throw new Error(`Maximum 10 photos allowed per inspection.`);
      }
      if (reportsCount > 3) {
        throw new Error(`Maximum 3 reports allowed per inspection.`);
      }
    }

    next();
  } catch (error) {
    // If validation fails, clean up the files that multer already wrote
    await cleanupFiles(req);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cleanupFiles = async (req) => {
  const files = [];
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      for (const key in req.files) {
        files.push(...req.files[key]);
      }
    }
  } else if (req.file) {
    files.push(req.file);
  }

  for (const file of files) {
    try {
      await fs.unlink(file.path);
    } catch (err) {
      console.error(`Failed to delete file ${file.path}`, err);
    }
  }
};
