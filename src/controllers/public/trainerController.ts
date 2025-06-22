// src/controller/public/trainerController
import { Request, Response } from 'express';
import Trainer from '../../models/Trainer';

// Lấy danh sách huấn luyện viên
export const getTrainers = async (req: Request, res: Response): Promise<void> => {
  try {
    const trainers = await Trainer.find( {status: 'active'});

    if (!trainers || trainers.length === 0) {
      res.status(404).json({ success: false, message: 'Không có huấn luyện viên nào' });
      return;
    }

    res.status(200).json({ success: true, data: trainers });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách huấn luyện viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server',  });
  }
};
// Lấy thông tin chi tiết của huấn luyện viên theo ID
export const getTrainerById = async (req: Request, res: Response): Promise<void> => {
  const { trainerId } = req.params;

  try {
    const trainer = await Trainer.findById(trainerId);

    if (!trainer) {
      res.status(404).json({ success: false, message: 'Không tìm thấy huấn luyện viên' });
      return;
    }

    res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin huấn luyện viên:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] });
  }
};

export default{
  getTrainers, 
  getTrainerById
}