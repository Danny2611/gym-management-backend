// # Xử lý upload file
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Define storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the upload directory
    const uploadDir = 'public/uploads/avatars';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: userId-timestamp-originalname
    const userId = (req as any).userId || 'guest';
    const timestamp = Date.now();
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}-${timestamp}${fileExt}`;
    
    cb(null, fileName);
  }
});

// Define file filter to only allow image uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, png, gif, webp)'));
  }
};

// Configure multer with limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Middleware for single file upload
export const uploadFile = upload.single('avatar');

// Middleware for multiple file upload (if needed)
export const uploadMultipleFiles = upload.array('images', 5); // max 5 files

// Custom middleware to handle file deletion
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Lỗi khi xóa file:', error);
    return false;
  }
};