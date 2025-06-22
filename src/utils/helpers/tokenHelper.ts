import crypto from 'crypto';

// Tạo token reset password
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};