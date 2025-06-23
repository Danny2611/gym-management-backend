// src/middlewares/upload.ts
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import { Request } from 'express';
import cloudinary from '~/config/cloudinary';

// Multer Cloudinary Storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const userId = (req as any).userId || 'guest';
    return {
      folder: 'gym-management/avatars',
      public_id: `${userId}-${Date.now()}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }],
    };
  },
});

// File filter giống như trước
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, png, gif, webp)'));
  }
};

// Cấu hình multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Middleware giống cũ
export const uploadFile = upload.single('avatar');
export const uploadMultipleFiles = upload.array('images', 5);

// Hàm xóa ảnh trên Cloudinary
export const deleteCloudinaryFile = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Lỗi khi xóa file Cloudinary:', error);
    return false;
  }
};
