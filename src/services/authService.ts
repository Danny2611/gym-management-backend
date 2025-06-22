import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../config/jwt';
import Member from '../models/Member';
import Role from '../models/Role';
import { sendOTPEmail } from './emailService';

export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) => {
  const { name, email, password, phone } = userData;
  
  // Kiểm tra email
  const existingUser = await Member.findOne({ email });
  if (existingUser) {
    throw new Error('Email đã được sử dụng');
  }
  
  // Tìm vai trò mặc định
  const defaultRole = await Role.findOne({ name: 'Member' });
  if (!defaultRole) {
    throw new Error('Không tìm thấy vai trò mặc định');
  }
  
  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Tạo OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
  
  // Tạo người dùng mới
  const newUser = await Member.create({
    name,
    email,
    password: hashedPassword,
    phone,
    otp,
    otpExpires,
    role: defaultRole._id,
    isVerified: false,
    status: 'pending',
  });
  
  // Gửi email xác thực
  await sendOTPEmail(email, otp);
  
  return { userId: newUser._id };
};

export const loginUser = async (email: string, password: string) => {
  // Tìm người dùng
  const user = await Member.findOne({ email });
  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }
  
  // Kiểm tra mật khẩu
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }
  
  // Kiểm tra xác thực
  if (!user.isVerified) {
    throw new Error('Tài khoản chưa được xác thực. Vui lòng kiểm tra email');
  }
  
  // Lấy thông tin vai trò
  const role = await Role.findById(user.role);
  
  const roleName = role ? role.name : 'Member';
  console.log("loginName", roleName)
  // Tạo token với thông tin vai trò
  const accessToken = generateAccessToken(String(user._id), roleName);
  const refreshToken = generateRefreshToken(String(user._id), roleName);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleName: roleName, // Thêm tên vai trò,
      avatar: user.avatar
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

export const verifyUserOTP = async (email: string, otp: string) => {
    const user = await Member.findOne({ email });
  
    if (!user || !user.otpExpires || user.otp !== otp || user.otpExpires < new Date()) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn');
    }
  
    user.isVerified = true;
    user.status = 'active';
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
  
    return { verified: true };
  };
  

export const refreshUserTokens = async (userId: string) => {
  const user = await Member.findById(userId);
  
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
  };
};