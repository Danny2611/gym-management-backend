import { body, param, validationResult } from 'express-validator';
import { Request } from 'express';

// Validator cho đăng ký gói tập
export const validateRegisterPackage = [
  body('packageId')
    .isMongoId()
    .withMessage('ID gói tập không hợp lệ'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu phải là định dạng ngày hợp lệ')
];

// Function xử lý validate error
export const validatePackageRequest = async (req: Request) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errors.array().map(error => ({
        field: 'param' in error ? error.param : 'general', // Tránh lỗi nếu error không có 'param'
        message: error.msg
      }));
    }
    return [];
  };
  