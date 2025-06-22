import { Request } from 'express';
import { check, validationResult, ValidationError } from 'express-validator';

const formatErrors = (errors: ValidationError[]) => {
  return errors
    .filter(error => 'param' in error) // Chỉ lấy lỗi có param
    .map(error => ({
      field: (error as any).param, // Ép kiểu để tránh lỗi TypeScript
      message: error.msg
    }));
};

/**
 * Hàm kiểm tra dữ liệu đầu vào cho yêu cầu thanh toán
 */
export const validatePaymentRequest = async (req: Request) => {
  // Định nghĩa các quy tắc validate
  await Promise.all([
    check('packageId')
      .notEmpty().withMessage('Vui lòng chọn gói tập')
      .isMongoId().withMessage('ID gói tập không hợp lệ')
      .run(req)
  ]);

  // Lấy kết quả validate
  const errors = validationResult(req);
  return errors.isEmpty() ? [] : formatErrors(errors.array());
};

/**
 * Hàm kiểm tra dữ liệu đầu vào cho callback từ MoMo
 */
export const validateMoMoCallback = async (req: Request) => {
  // Định nghĩa các quy tắc validate
  await Promise.all([
    check('partnerCode').notEmpty().withMessage('partnerCode is required').run(req),
    check('orderId').notEmpty().withMessage('orderId is required').run(req),
    check('requestId').notEmpty().withMessage('requestId is required').run(req),
    check('amount').notEmpty().isNumeric().withMessage('amount is required and must be numeric').run(req),
    check('resultCode').notEmpty().withMessage('resultCode is required').run(req),
    check('signature').notEmpty().withMessage('signature is required').run(req)
  ]);

  // Lấy kết quả validate
  const errors = validationResult(req);
  return errors.isEmpty() ? [] : formatErrors(errors.array());
};
