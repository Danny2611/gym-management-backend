import { Types } from 'mongoose';
import { IPackageSummary } from './package';


export interface IPromotion {
  _id: string;
  name: string;
  description?: string;
  discount: number;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive';
  applicable_packages: IPackageSummary[]; // sử dụng summary đã populate
  created_at: Date;
  updated_at: Date;
}

// export interface IPromotion {
//   _id?: Types.ObjectId;
//   name: string;
//   description?: string;
//   discount: number;
//   start_date: Date;
//   end_date: Date;
//   status: 'active' | 'inactive';
//   applicable_packages: Types.ObjectId[];
//   created_at: Date;
//   updated_at: Date;
// }
