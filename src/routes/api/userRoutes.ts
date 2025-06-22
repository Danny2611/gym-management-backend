import express from 'express';
import { authenticateJWT } from '~/middlewares/auth';
import { memberUpdateValidationRules } from '~/utils/validators/memberValidator';
import { workoutScheduleValidator, updateWorkoutScheduleStatusValidator,workoutSuggestionValidator } from '~/utils/validators/workoutValidator';
import { bodyMetricsValidationRules } from '~/utils/validators/progressValidator';

import memberController from '~/controllers/user/memberController';
import paymentController from '~/controllers/user/paymentController';
import membershipController from '~/controllers/user/membershipController';
import packageController from '~/controllers/user/packageController';
import appointmentController from '~/controllers/user/appointmentController';
import transactionController from '~/controllers/user/transactionController';
import workoutController from '~/controllers/user/workoutController';
import progressController from '~/controllers/user/progressController';

const router = express.Router();

//momo
router.get('/payment/momo/callback', paymentController.momoRedirectCallback);// Route redirect từ MoMo sau khi thanh toán
router.post('/momo/ipn', paymentController.momoIpnCallback);// Route callback từ MoMo (IPN)

router.use(authenticateJWT);// All these routes require authentication

// Member profile routes
router.get('/profile', memberController.getCurrentProfile);
router.put('/profile', memberUpdateValidationRules(), memberController.updateProfile);
router.put('/profile/avatar', memberController.updateAvatar);
router.put('/profile/email', memberController.updateEmail);
router.post('/deactivate', memberController.deactivateAccount);

// membership Routes
router.get('/training-locations', membershipController.getMemberTrainingLocations);
router.post('/packages/register', packageController.registerPackage);
router.get('/my-package', membershipController.getMemberships);
router.get('/my-package-active', membershipController.getMembershipsActive);
router.post('/my-package/detail', membershipController.getMembershipById);
router.patch('/my-package/pause', membershipController.pauseMembership);
router.patch('/my-package/resume', membershipController.resumeMembership);
router.get('/my-package/infor-membership', membershipController.getInforMembershipDetails);

// Route lịch hẹn
router.get('/appointments/next-week', appointmentController.getUpcomingAppointments);
router.post('/appointments', appointmentController.createAppointment); // Tạo lịch hẹn
router.get('/my-schedule', appointmentController.getMemberSchedule);// Lấy danh sách lịch hẹn đã xác nhận của hội viên
router.get('/appointments', appointmentController.getAllMemberAppointments); // Lấy danh sách lịch hẹn của hội viên
router.get('/appointments/:appointmentId', appointmentController.getAppointmentById); // Lấy danh sách lịch hẹn của hội viên
router.delete('/:appointmentId/cancel', appointmentController.cancelAppointment); // Hủy lịch hẹn
router.put('/:appointmentId/complete', appointmentController.completeAppointment);
router.put('/:appointmentId/reschedule', appointmentController.rescheduleAppointment); // Đổi lịch hẹn
router.post('/appointments/check-availability', appointmentController.checkTrainerAvailability); // Kiểm tra lịch trống của huấn luyện viên

//lịch tập cá nhân
router.post(
  '/workout/suggestions', workoutSuggestionValidator, workoutController.getWorkoutSuggestions);// Lấy gợi ý bài tập
router.post(
  '/workout/schedules',workoutScheduleValidator, workoutController.createWorkoutSchedule);// Tạo lịch tập cá nhân
router.get('/workout/schedules', workoutController.getMemberWorkoutSchedules);// Lấy danh sách lịch tập
router.get('/workout/schedules/:scheduleId', workoutController.getWorkoutScheduleById);// Lấy chi tiết lịch tập
router.patch(
  '/workout/schedules/:scheduleId/status',
  updateWorkoutScheduleStatusValidator, workoutController.updateWorkoutScheduleStatus);

router.get('/workout/weekly', workoutController.getWeeklyWorkoutStats);
router.get('/workout/monthly-comparison', workoutController.getMonthComparisonStats);
router.get('/workout/last-7-days', workoutController.getLast7DaysWorkouts);
router.get('/workout/next-week', workoutController.getUpcomingWorkouts);









// Progress Tracking Routes
router.get('/progress/metrics/latest', progressController.getLatestBodyMetrics); // Lấy chỉ số cơ thể mới nhất
router.get('/progress/metrics/initial', progressController.getInitialBodyMetrics); // Lấy chỉ số cơ thể ban đầu
router.get('/progress/metrics/previous-month', progressController.getPreviousMonthBodyMetrics); // Lấy chỉ số cơ thể tháng trước
router.get('/progress/metrics/comparison', progressController.getBodyMetricsComparison); // Lấy so sánh chỉ số cơ thể
router.post('/progress/metrics', bodyMetricsValidationRules(), progressController.updateBodyMetrics); // Cập nhật chỉ số cơ thể
router.get('/progress/stats/monthly', progressController.getBodyStatsProgressByMonth); // Lấy tiến độ chỉ số cơ thể theo tháng
router.get('/progress/radar', progressController.getFitnessRadarData); // Lấy dữ liệu radar thể lực
router.get('/progress/metrics/changes',  progressController.calculateBodyMetricsChange); // Tính toán thay đổi chỉ số cơ thể
router.get('/progress/monthly-body-metrics',  progressController.getFormattedMonthlyBodyMetrics);

  
// transaction
router.get('/transactions', transactionController.getAllMemberTransactions); // lấy danh sách giao dịch
router.post('/transaction-details', transactionController.getTransactionById) // lấy giao dịch  details
router.get('/transaction/success', transactionController.getRecentSuccessfulTransactions) // lấy giao dịch  details


// Payment routes
router.post('/momo/create', paymentController.createMoMoPayment);// Route tạo thanh toán MoMo
router.get('/payments/:paymentId/status',  paymentController.getPaymentStatus);// Kiểm tra trạng thái thanh toán (cho frontend polling)
router.get('/:paymentId', paymentController.getPaymentById);// Route lấy thông tin thanh toán




export default router;