// src/utils/validators/workoutValidator.ts
import { body } from 'express-validator';

export const workoutSuggestionValidator = [
  body('muscleGroup')
    .notEmpty()
    .withMessage('Vui lòng chọn nhóm cơ')
    .isString()
    .withMessage('Nhóm cơ phải là chuỗi'),

  body('goal')
    .isIn(['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility'])
    .withMessage('Mục tiêu không hợp lệ'),

  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Cấp độ không hợp lệ'),

  body('equipment')
    .isIn(['bodyweight', 'dumbbell', 'barbell', 'machine', 'mixed'])
    .withMessage('Thiết bị không hợp lệ')
];

export const workoutScheduleValidator = [
  body('date')
    .notEmpty()
    .withMessage('Vui lòng chọn ngày tập')
    .isISO8601()
    .withMessage('Ngày tập không hợp lệ'),

  body('timeStart')
    .notEmpty()
    .withMessage('Vui lòng chọn giờ bắt đầu')
    .isISO8601()
    .withMessage('Giờ bắt đầu không hợp lệ'),

  body('duration')
    .isInt({ min: 15, max: 300 })
    .withMessage('Thời lượng phải từ 15 đến 300 phút'),

  body('muscle_groups')
    .isArray({ min: 1 })
    .withMessage('Vui lòng chọn ít nhất một nhóm cơ'),

  body('location')
    .notEmpty()
    .withMessage('Vui lòng chọn địa điểm tập')
    .isString()
    .withMessage('Địa điểm phải là chuỗi'),

  body('exercises')
    .optional()
    .isArray()
    .withMessage('Danh sách bài tập phải là một mảng'),

  body('exercises.*.name')
    .optional()
    .isString()
    .withMessage('Tên bài tập phải là chuỗi'),

  body('exercises.*.sets')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số hiệp phải ít nhất là 1'),

  body('exercises.*.reps')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số lần lặp lại phải ít nhất là 1'),

  body('exercises.*.weight')
    .optional()
    .isNumeric()
    .withMessage('Trọng lượng phải là số'),

  body('workout_suggestion_id')
    .optional()
    .isMongoId()
    .withMessage('ID gợi ý bài tập không hợp lệ'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Ghi chú phải là chuỗi')
];

export const updateWorkoutScheduleStatusValidator = [
  body('status')
  .isIn(['upcoming', 'completed', 'missed'])
  .withMessage('Trạng thái không hợp lệ')
]