// # Validate dữ liệu hội viên
import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import Member from '../../models/Member';

/**
 * Validation rules for member update
 */
export const memberUpdateValidationRules = (): ValidationChain[] => {
  return [
    body('name')
      .optional()
      .isString()
      .withMessage('Tên phải là một chuỗi')
      .isLength({ min: 2, max: 100 })
      .withMessage('Tên phải có độ dài từ 2-100 ký tự')
      .trim(),
    
    body('phone')
      .optional()
      .custom(async (value, { req }) => {
        // Chỉ validate số điện thoại nếu giá trị thay đổi
        const userId = (req as any).userId;
        const member = await Member.findById(userId);
        
        // Nếu số điện thoại không thay đổi thì bỏ qua validation
        if (member && member.phone === value) {
          return true;
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        const existingMember = await Member.findOne({ phone: value }).select('_id').lean();
        
        if (existingMember && existingMember._id.toString() !== userId) {
          throw new Error('Số điện thoại đã được sử dụng bởi tài khoản khác');
        }

        // Validate format số điện thoại
        if (value && !/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/.test(value)) {
          throw new Error('Số điện thoại không hợp lệ');
        }

        return true;
      }),
    
      body('dateOfBirth')
      .optional()
      .custom(async (value, { req }) => {
        // 1. Kiểm tra nếu không có giá trị mới
        if (!value) return true;
    
        // 2. Chuyển đổi ngày sinh mới
        const newDob = new Date(value);
        if (isNaN(newDob.getTime())) {
          throw new Error('Ngày sinh không hợp lệ');
        }
    
        // 3. Kiểm tra tuổi (10-100 tuổi)
        const now = new Date();
        const minAgeDate = new Date(now.setFullYear(now.getFullYear() - 10));
        const maxAgeDate = new Date(now.setFullYear(now.getFullYear() - 100));
    
        if (newDob > minAgeDate) {
          throw new Error('Hội viên phải ít nhất 10 tuổi');
        }
        if (newDob < maxAgeDate) {
          throw new Error('Ngày sinh không hợp lệ');
        }
    
        // 4. Kiểm tra nếu ngày sinh không thay đổi (chỉ khi có userId)
        const userId = (req as any).userId;
        if (userId) {
          const member = await Member.findById(userId).select('dateOfBirth').lean();
          
          if (member?.dateOfBirth) {
            const currentDob = new Date(member.dateOfBirth).toISOString().split('T')[0];
            const newDobStr = newDob.toISOString().split('T')[0];
            
            if (currentDob === newDobStr) {
              return true; // Ngày sinh không thay đổi
            }
          }
        }
    
        return true;
      }),
    
      body('email')
      .optional()
      .isEmail()
      .withMessage('Email không hợp lệ')
      .normalizeEmail()
      .custom(async (value, { req }) => {
        // Check if email already exists for another user
        const userId = (req as any).userId;
        const existingMember = await Member.findOne({ email: value });
        
        if (existingMember  !== userId) {
          throw new Error('Email đã được sử dụng bởi tài khoản khác');
        }
        return true;
      })

      ];
};

/**
 * Middleware to validate member update
 */
export const validateMemberUpdate = async (req: Request, res: Response, next?: NextFunction): Promise<boolean> => {
  // Lấy tất cả các trường có trong request body
  const requestFields = Object.keys(req.body);
  
  // Lọc các validation rules chỉ áp dụng cho các trường có trong request
  const validationRules = memberUpdateValidationRules().filter(rule => {
    // Kiểm tra an toàn trước khi truy cập field
    const field = getValidatorField(rule);
    return field && requestFields.includes(field);
  });

  // Chạy validation
  for (const validation of validationRules) {
    await validation.run(req);
  }

  const errors = validationResult(req);
  if (errors.isEmpty()) {
    if (next) next();
    return true;
  }

  res.status(400).json({
    success: false,
    message: 'Dữ liệu không hợp lệ',
    errors: errors.array()
  });
  
  return false;
};

// Hàm helper để lấy field name từ validator
function getValidatorField(validator: ValidationChain): string | null {
  // Kiểm tra các cách khác nhau để lấy field name tùy thuộc vào phiên bản express-validator
  if (validator['fields']) {
    return validator['fields'][0];
  }
  if (validator['context']?.fields) {
    return validator['context'].fields[0];
  }
  return null;
}
/**
 * Validation rules for complete member creation
 */
export const memberCreateValidationRules = (): ValidationChain[] => {
  return [
    body('name')
      .notEmpty()
      .withMessage('Tên không được để trống')
      .isString()
      .withMessage('Tên phải là một chuỗi')
      .isLength({ min: 2, max: 100 })
      .withMessage('Tên phải có độ dài từ 2-100 ký tự')
      .trim(),
    
    body('email')
      .notEmpty()
      .withMessage('Email không được để trống')
      .isEmail()
      .withMessage('Email không hợp lệ')
      .normalizeEmail()
      .custom(async (value) => {
        // Check if email already exists
        const existingMember = await Member.findOne({ email: value });
        if (existingMember) {
          throw new Error('Email đã được sử dụng');
        }
        return true;
      }),
    
    body('password')
      .notEmpty()
      .withMessage('Mật khẩu không được để trống')
      .isLength({ min: 8 })
      .withMessage('Mật khẩu phải có ít nhất 8 ký tự')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w\W]{8,}$/)
      .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),
    
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Giới tính phải là male, female hoặc other'),

  body('phone')
  .optional()
  .matches(/^(\+84|84|0)?[1-9][0-9]{8,9}$/)
  .withMessage('Số điện thoại không hợp lệ')
  .custom(async (value, { req }) => {
    const userId = (req as any).userId;
    const existingMember = await Member.findOne({ phone: value }).select('_id').lean();
    
    // Kiểm tra và ép kiểu
    if (existingMember && existingMember._id.toString() !== userId) {
      throw new Error('Số điện thoại đã được sử dụng bởi tài khoản khác');
    }
    return true;
  }),
    
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Ngày sinh không hợp lệ')
      .toDate()
      .custom((value) => {
        // Check if user is at least 10 years old
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        if (value > tenYearsAgo) {
          throw new Error('Hội viên phải ít nhất 10 tuổi');
        }
        return true;
      }),
    
    body('address')
      .optional()
      .isString()
      .withMessage('Địa chỉ phải là một chuỗi')
      .isLength({ min: 5, max: 255 })
      .withMessage('Địa chỉ phải có độ dài từ 5-255 ký tự')
      .trim(),
      body('email')
      .optional()
      .isEmail()
      .withMessage('Email không hợp lệ')
      .normalizeEmail()
      .custom(async (value, { req }) => {
        const userId = (req as any).userId;
        const existingMember = await Member.findOne({ email: value }).select('_id').lean();
        
        // Chỉ báo lỗi nếu email thuộc user khác
        if (existingMember && existingMember._id.toString() !== userId) {
          throw new Error('Email đã được sử dụng bởi tài khoản khác');
        }
        return true;
      })
  ];
};

/**
 * Middleware to validate member creation
 */
export const validateMemberCreate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Apply validation rules
  const validationRules = memberCreateValidationRules();
  
  // Execute validators
  for (const validation of validationRules) {
    const result = await validation.run(req);
    if (result.array().length) break;
  }
  
  // Check if validation passed
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }
  
  // Return validation errors if any
  res.status(400).json({
    success: false,
    errors: errors.array()
  });
};