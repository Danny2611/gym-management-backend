// src/utils/validators/progressValidator.ts
import { body } from 'express-validator';

export const bodyMetricsValidationRules = () => {
  return [
    body('weight')
      .optional()
      .isNumeric()
      .withMessage('Cân nặng phải là số')
      .isFloat({ min: 30, max: 300 })
      .withMessage('Cân nặng phải từ 30kg đến 300kg'),
    
    body('height')
      .optional()
      .isNumeric()
      .withMessage('Chiều cao phải là số')
      .isFloat({ min: 100, max: 250 })
      .withMessage('Chiều cao phải từ 100cm đến 250cm'),
    
    body('muscle_mass')
      .optional()
      .isNumeric()
      .withMessage('Khối lượng cơ phải là số')
      .isFloat({ min: 10, max: 200 })
      .withMessage('Khối lượng cơ phải từ 10kg đến 200kg'),
    
    body('body_fat')
      .optional()
      .isNumeric()
      .withMessage('Tỷ lệ mỡ phải là số')
      .isFloat({ min: 1, max: 60 })
      .withMessage('Tỷ lệ mỡ phải từ 1% đến 60%')
  ];
};

export default {
  bodyMetricsValidationRules
};