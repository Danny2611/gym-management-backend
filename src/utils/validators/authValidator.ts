import { body } from 'express-validator';

export const registerValidator = [
  body('name')
    .notEmpty().withMessage('Tên không được để trống')
    .isLength({ min: 2, max: 50 }).withMessage('Tên phải từ 2-50 ký tự'),
  body('email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Mật khẩu phải ít nhất 8 ký tự bao gồm ít nhất 1 chữ số và 1 chữ in hoa')
    .matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất 1 số')
    .matches(/[A-Z]/).withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa'),
  body('phone')
    .notEmpty().withMessage('Số điện thoại không được để trống')
    .matches(/^\d{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
];

export const loginValidator = [
  body('email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống'),
];

export const forgotPasswordValidator = [
  body('email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Mật khẩu phải ít nhất 8 ký tự')
    .matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất 1 số')
    .matches(/[A-Z]/).withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa')
    .custom((newPassword, { req }) => {
      if (newPassword === req.body.currentPassword) {
        throw new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      }
      return true;
    }),
];


export const verifyOTPValidator = [
  body('email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP phải có 6 ký tự')
    .isNumeric().withMessage('OTP phải là số'),
];