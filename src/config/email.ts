// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';

// dotenv.config();

// // Cấu hình SMTP
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     secure: false, // false nếu dùng TLS (port 587), true nếu dùng SSL (port 465)
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     },
// });

// // Gửi OTP xác nhận email
// export const sendOTPEmail = async (email: string, otp: string) => {
//     await transporter.sendMail({
//         from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
//         to: email,
//         subject: 'Xác nhận đăng ký tài khoản',
//         html: `<p>Mã OTP xác thực của bạn là: <b>${otp}</b></p>
//                <p>Mã này sẽ hết hạn sau 10 phút.</p>`,
//     });
// };

// // Gửi mật khẩu mới khi quên mật khẩu
// export const sendNewPasswordEmail = async (email: string, newPassword: string) => {
//     await transporter.sendMail({
//         from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
//         to: email,
//         subject: 'Mật khẩu mới của bạn',
//         html: `<p>Mật khẩu mới của bạn là: <b>${newPassword}</b></p>
//                <p>Hãy đăng nhập và đổi mật khẩu ngay!</p>`,
//     });
// };
