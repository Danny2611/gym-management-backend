
// src/types/Package.ts
import { Document, Types } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  description?: string;
  duration: number; // Duration in days
  price: number;
  category?: string;
  features?: string[];
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Interface for promotion data
export interface IPromotion extends Document {
  name: string;
  description: string;
  discount: number; // Percentage discount
  start_date: Date;
  end_date: Date;
  applicable_packages: Types.ObjectId[] | string[];
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

// Interface for the promotion data attached to a package
export interface IPackagePromotion {
  name: string;
  description?: string;
  discount: number;
  start_date: Date;
  end_date: Date;
  discountedPrice: number;
}

// Interface for package with promotion data
export interface IPackageWithPromotion extends IPackage {
  promotion?: IPackagePromotion;
}

// Interface for the complete package response with details
export interface IPackageResponse {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  features: string[];
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  promotion?: IPackagePromotion;
  details: {
    package_id: Types.ObjectId;
    schedule: string[];
    training_areas: string[];
    additional_services: string[];
    status: 'active' | 'inactive';
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
  } | null;
}


export interface IPackageSummary {
  _id: Types.ObjectId ;
  name: string;
  price: number;
  benefits: string[];
}
