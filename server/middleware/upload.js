import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter,
});

// Profile image processing middleware
export const processProfileImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-pics');
    
    // Ensure uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const filename = `profile-${timestamp}-${randomSuffix}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Process image with sharp
    await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Add processed file info to request
    req.processedFile = {
      filename,
      path: filepath,
      url: `/uploads/profile-pics/${filename}`
    };

    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(400).json({ 
      message: 'Failed to process image', 
      error: error.message 
    });
  }
};

// Delete old profile image
export const deleteOldProfileImage = async (oldImageUrl) => {
  if (!oldImageUrl || !oldImageUrl.startsWith('/uploads/profile-pics/')) {
    return;
  }

  try {
    const filename = path.basename(oldImageUrl);
    const filepath = path.join(process.cwd(), 'uploads', 'profile-pics', filename);
    
    await fs.unlink(filepath);
    console.log(`Deleted old profile image: ${filename}`);
  } catch (error) {
    console.error('Error deleting old profile image:', error);
  }
};

export const uploadProfileImage = upload.single('profileImage');