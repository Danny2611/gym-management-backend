import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: 'Xác thực tài khoản FittLife',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Xác thực tài khoản FittLife</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản FittLife. Vui lòng sử dụng mã OTP sau để xác thực tài khoản:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>Mã OTP có hiệu lực trong vòng 10 phút.</p>
        <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ FittLife</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendNewPasswordEmail = async (email: string, newPassword: string) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: email,
    subject: 'Mật khẩu mới - FittLife',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mật khẩu mới - FittLife</h2>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Mật khẩu mới của bạn là:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 20px; margin: 20px 0;">
          <strong>${newPassword}</strong>
        </div>
        <p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ ngay với chúng tôi.</p>
        <p>Trân trọng,<br>Đội ngũ FittLife</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};