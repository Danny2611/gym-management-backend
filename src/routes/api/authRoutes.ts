// routes/auth/authRoutes.ts
import express from 'express';
import passport from 'passport';
import { register, login, refreshToken } from '../../controllers/auth/authController';
import { forgotPassword, changePassword, validateCurrentPassword } from '../../controllers/auth/passwordController';
import { verifyOTP, resendOTP } from '../../controllers/auth/verificationController';
import { googleCallback, facebookCallback } from '../../controllers/auth/socialAuthController';
import { authenticateJWT, authenticateRefreshToken } from '../../middlewares/auth';
import { 
  registerValidator, 
  loginValidator, 
  forgotPasswordValidator,
  changePasswordValidator,
  verifyOTPValidator
} from '../../utils/validators/authValidator';

const router = express.Router();

// Đăng ký & Đăng nhập
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh-token', authenticateRefreshToken, refreshToken);

// Xác thực
router.post('/verify-otp', verifyOTPValidator, verifyOTP);
router.post('/resend-otp', forgotPasswordValidator, resendOTP);

// Quản lý mật khẩu
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/change-password', authenticateJWT, changePasswordValidator, changePassword);
router.post('/validate-current-password', authenticateJWT, validateCurrentPassword);
// OAuth - Google
router.get('/google', (req, res, next) => {
  const callbackUrl = req.query.callbackUrl;
  const state = callbackUrl ? Buffer.from(JSON.stringify({ callbackUrl })).toString('base64') : undefined;
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state
  })(req, res, next);
});

router.get('/google/callback', 
  (req, res, next) => {
    // Lấy callbackUrl từ state nếu có
    if (req.query.state) {
      try {
        const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
        if (stateData.callbackUrl) {
          req.query.callbackUrl = stateData.callbackUrl;
        }
      } catch (error) {
        console.error('Error parsing state:', error);
      }
    }
    next();
  },
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  googleCallback
);

// OAuth - Facebook
router.get('/facebook', (req, res, next) => {
  const callbackUrl = req.query.callbackUrl;
  const state = callbackUrl ? Buffer.from(JSON.stringify({ callbackUrl })).toString('base64') : undefined;
  
  passport.authenticate('facebook', { 
    scope: ['email'],
    state
  })(req, res, next);
});

router.get('/facebook/callback',
  (req, res, next) => {
    // Lấy callbackUrl từ state nếu có
    if (req.query.state) {
      try {
        const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
        if (stateData.callbackUrl) {
          req.query.callbackUrl = stateData.callbackUrl;
        }
      } catch (error) {
        console.error('Error parsing state:', error);
      }
    }
    next();
  },
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  facebookCallback
);

export default router;

// import express from 'express';
// import passport from 'passport';
// import { register, login, refreshToken } from '../../controllers/auth/authController';
// import { forgotPassword, changePassword } from '../../controllers/auth/passwordController';
// import { verifyOTP, resendOTP } from '../../controllers/auth/verificationController';
// import { googleCallback, facebookCallback } from '../../controllers/auth/socialAuthController';
// import { authenticateJWT, authenticateRefreshToken } from '../../middlewares/auth';
// import { 
//   registerValidator, 
//   loginValidator, 
//   forgotPasswordValidator,
//   changePasswordValidator,
//   verifyOTPValidator
// } from '../../utils/validators/authValidator';

// const router = express.Router();

// // Đăng ký & Đăng nhập
// router.post('/register', registerValidator, register);
// router.post('/login', loginValidator, login);
// router.post('/refresh-token', authenticateRefreshToken, refreshToken);

// // Xác thực
// router.post('/verify-otp', verifyOTPValidator, verifyOTP);
// router.post('/resend-otp', forgotPasswordValidator, resendOTP);

// // Quản lý mật khẩu
// router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
// router.post('/change-password', authenticateJWT, changePasswordValidator, changePassword);

// // OAuth - Google
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
// router.get('/google/callback', 
//   passport.authenticate('google', { session: false, failureRedirect: '/login' }),
//   googleCallback
// );

// // OAuth - Facebook
// router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
// router.get('/facebook/callback', (req, res, next) => {
//     console.log('Facebook callback route hit');
//     next();
// }, passport.authenticate('facebook', { session: false }), (req, res) => {
//     res.json({ message: 'Đăng nhập Facebook thành công', user: req.user });
// });


// export default router;