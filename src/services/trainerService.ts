// src/services/trainerService.ts
import Trainer from '../models/Trainer';
import cron from 'node-cron';

/**
 * Đặt lại trạng thái sẵn sàng (available) cho tất cả lịch làm việc của HLV vào đầu mỗi tuần.
 * Hàm này được thiết kế để chạy mỗi tuần một lần (ví dụ: lúc nửa đêm Chủ Nhật hoặc rạng sáng Thứ Hai).
 */
export async function resetTrainerAvailability(): Promise<void> {
  try {
    const result = await Trainer.updateMany(
      {}, // Cập nhật tất cả huấn luyện viên
      {
        $set: {
          // Đặt tất cả các khung giờ làm việc thành sẵn sàng (available = true)
          'schedule.$[].workingHours.$[hour].available': true
        }
      },
      {
        arrayFilters: [
          { 'hour.available': false } // Chỉ cập nhật những giờ hiện đang không sẵn sàng
        ],
        multi: true
      }
    );
    
    console.log(`Đã đặt lại trạng thái sẵn sàng cho ${result.modifiedCount} mục trong lịch của HLV.`);
  } catch (error) {
    console.error('Lỗi khi đặt lại trạng thái sẵn sàng của HLV:', error);
  }
}

/**
 * Cập nhật trạng thái sẵn sàng (available) cho một khung giờ làm việc cụ thể của HLV.
 * Được sử dụng khi có lịch hẹn được đặt hoặc hủy.
 */
export async function updateTrainerAvailability(
  trainerId: string,
  dayOfWeek: number,
  timeStart: string,
  available: boolean
): Promise<boolean> {
  try {
    // Tìm HLV và khung giờ cụ thể cần cập nhật
    const result = await Trainer.updateOne(
      {
        _id: trainerId,
        'schedule.dayOfWeek': dayOfWeek,
        'schedule.workingHours': {
          $elemMatch: {
            start: { $lte: timeStart },
            end: { $gt: timeStart }
          }
        }
      },
      {
        $set: {
          'schedule.$[day].workingHours.$[hour].available': available,
          updated_at: new Date()
        }
      },
      {
        arrayFilters: [
          { 'day.dayOfWeek': dayOfWeek },
          { 
            'hour.start': { $lte: timeStart },
            'hour.end': { $gt: timeStart }
          }
        ]
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái sẵn sàng của HLV:', error);
    return false;
  }
}

/**
 * Lấy danh sách HLV còn trống (available) theo ngày và giờ cụ thể
 */
export async function getAvailableTrainers(
  dayOfWeek: number,
  timeStart: string
): Promise<any[]> {
  try {
    const trainers = await Trainer.find({
      'schedule': {
        $elemMatch: {
          dayOfWeek: dayOfWeek,
          available: true,
          workingHours: {
            $elemMatch: {
              start: { $lte: timeStart },
              end: { $gt: timeStart },
              available: true
            }
          }
        }
      }
    }).select('_id name image specialization');
    
    return trainers;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách HLV sẵn sàng:', error);
    return [];
  }
}

/**
 * Khởi tạo các tác vụ định kỳ liên quan đến HLV
 */
export function initScheduledTrainerJobs(): void {
  // Chạy lúc 00:01 sáng Thứ Hai hàng tuần
  cron.schedule('1 0 * * 1', async () => {
    console.log('Đang chạy tác vụ định kỳ: Đặt lại trạng thái sẵn sàng của HLV');
    await resetTrainerAvailability();
  });
}

export default {
  resetTrainerAvailability,
  updateTrainerAvailability,
  getAvailableTrainers,
  initScheduledTrainerJobs
};
