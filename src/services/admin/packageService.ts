import Package, { IPackage } from '../../models/Package';
import PackageDetail, { IPackageDetail } from '../../models/PackageDetail';
import { Types } from 'mongoose';

// Define types for query options and response
export interface PackageQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  category?: 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  popular?: boolean;
}

export interface PackageResponse {
  _id: string;
  name: string;
  max_members?: number;
  price: number;
  duration: number;
  description?: string;
  benefits: string[];
  status: 'active' | 'inactive';
  category: 'basic' | 'fitness' | 'premium' | 'platinum' | 'vip';
  popular: boolean;
  training_sessions: number;
  session_duration: number;
  created_at: Date;
  updated_at: Date;
  packageDetail?: {
    schedule: string[];
    training_areas: string[];
    additional_services: string[];
  };
}

// Get all packages with pagination, filtering and sorting
export const getAllPackages = async (
  options: PackageQueryOptions
): Promise<{
  packages: PackageResponse[];
  totalPackages: number;
  totalPages: number;
  currentPage: number;
}> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
    sortBy,
    sortOrder,
    popular
  } = options;

  const query: any = { deleted_at: null };

  // Apply filters
  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (popular !== undefined) {
    query.popular = popular;
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const totalPackages = await Package.countDocuments(query);
  const totalPages = Math.ceil(totalPackages / limit);

  const sort: any = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.created_at = -1;
  }

  const packages = await Package.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Get package details for all packages
  const packageIds = packages.map(pkg => pkg._id);
  const packageDetails = await PackageDetail.find({
    package_id: { $in: packageIds },
    deleted_at: null,
    status: 'active'
  }).lean();

  const packageDetailsMap = packageDetails.reduce((map, detail) => {
    map[detail.package_id.toString()] = detail;
    return map;
  }, {} as Record<string, any>);

  const packageResponses: PackageResponse[] = packages.map(pkg => {
    const packageDetail = packageDetailsMap[pkg._id.toString()];
    
    return {
      _id: pkg._id.toString(),
      name: pkg.name,
      max_members: pkg.max_members,
      price: pkg.price,
      duration: pkg.duration,
      description: pkg.description,
      benefits: pkg.benefits,
      status: pkg.status,
      category: pkg.category || 'basic',
      popular: pkg.popular || false,
      training_sessions: pkg.training_sessions || 0,
      session_duration: pkg.session_duration || 60,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at,
      packageDetail: packageDetail ? {
        schedule: packageDetail.schedule,
        training_areas: packageDetail.training_areas,
        additional_services: packageDetail.additional_services
      } : undefined
    };
  });

  return {
    packages: packageResponses,
    totalPackages,
    totalPages,
    currentPage: page,
  };
};

// Get package by ID with its details
export const getPackageById = async (packageId: string): Promise<PackageResponse> => {
  const pkg = await Package.findOne({ _id: packageId, deleted_at: null }).lean();

  if (!pkg) {
    throw new Error('Không tìm thấy gói dịch vụ');
  }

  const packageDetail = await PackageDetail.findOne({
    package_id: packageId,
    deleted_at: null,
    status: 'active'
  }).lean();

  return {
    _id: pkg._id.toString(),
    name: pkg.name,
    max_members: pkg.max_members,
    price: pkg.price,
    duration: pkg.duration,
    description: pkg.description,
    benefits: pkg.benefits,
    status: pkg.status,
    category: pkg.category || 'basic',
    popular: pkg.popular || false,
    training_sessions: pkg.training_sessions || 0,
    session_duration: pkg.session_duration || 60,
    created_at: pkg.created_at,
    updated_at: pkg.updated_at,
    packageDetail: packageDetail ? {
      schedule: packageDetail.schedule,
      training_areas: packageDetail.training_areas,
      additional_services: packageDetail.additional_services
    } : undefined
  };
};

// Create a new package with optional details
export const createPackage = async (
  packageData: Partial<IPackage>,
  packageDetailData?: Partial<IPackageDetail>
): Promise<PackageResponse> => {
  // Create the package
  const newPackage = new Package({
    ...packageData,
    created_at: new Date(),
    updated_at: new Date()
  });

  const savedPackage = await newPackage.save();

  // Create package detail if provided
  let savedPackageDetail;
  if (packageDetailData) {
    const newPackageDetail = new PackageDetail({
      package_id: savedPackage._id,
      schedule: packageDetailData.schedule || [],
      training_areas: packageDetailData.training_areas || [],
      additional_services: packageDetailData.additional_services || [],
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    savedPackageDetail = await newPackageDetail.save();
  }

  return {
    _id: (savedPackage._id as Types.ObjectId).toString(),
    name: savedPackage.name,
    max_members: savedPackage.max_members,
    price: savedPackage.price,
    duration: savedPackage.duration,
    description: savedPackage.description,
    benefits: savedPackage.benefits,
    status: savedPackage.status,
    category: savedPackage.category || 'basic',
    popular: savedPackage.popular || false,
    training_sessions: savedPackage.training_sessions || 0,
    session_duration: savedPackage.session_duration || 60,
    created_at: savedPackage.created_at,
    updated_at: savedPackage.updated_at,
    packageDetail: savedPackageDetail ? {
      schedule: savedPackageDetail.schedule,
      training_areas: savedPackageDetail.training_areas,
      additional_services: savedPackageDetail.additional_services
    } : undefined
  };
};

// Update an existing package and its details
export const updatePackage = async (
  packageId: string,
  packageData: Partial<IPackage>,
  packageDetailData?: Partial<IPackageDetail>
): Promise<PackageResponse> => {
  // Update the package
  const updatedPackage = await Package.findOneAndUpdate(
    { _id: packageId, deleted_at: null },
    {
      ...packageData,
      updated_at: new Date()
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updatedPackage) {
    throw new Error('Không tìm thấy gói dịch vụ');
  }

  // Update or create package detail if provided
  let updatedPackageDetail;
  if (packageDetailData) {
    updatedPackageDetail = await PackageDetail.findOneAndUpdate(
      { package_id: packageId, deleted_at: null },
      {
        schedule: packageDetailData.schedule,
        training_areas: packageDetailData.training_areas,
        additional_services: packageDetailData.additional_services,
        updated_at: new Date()
      },
      { new: true, upsert: true }
    ).lean();
  } else {
    updatedPackageDetail = await PackageDetail.findOne({
      package_id: packageId,
      deleted_at: null,
      status: 'active'
    }).lean();
  }

  return {
    _id: updatedPackage._id.toString(),
    name: updatedPackage.name,
    max_members: updatedPackage.max_members,
    price: updatedPackage.price,
    duration: updatedPackage.duration,
    description: updatedPackage.description,
    benefits: updatedPackage.benefits,
    status: updatedPackage.status,
    category: updatedPackage.category || 'basic',
    popular: updatedPackage.popular || false,
    training_sessions: updatedPackage.training_sessions || 0,
    session_duration: updatedPackage.session_duration || 60,
    created_at: updatedPackage.created_at,
    updated_at: updatedPackage.updated_at,
    packageDetail: updatedPackageDetail ? {
      schedule: updatedPackageDetail.schedule,
      training_areas: updatedPackageDetail.training_areas,
      additional_services: updatedPackageDetail.additional_services
    } : undefined
  };
};

// Soft delete a package (set deleted_at)
export const deletePackage = async (packageId: string): Promise<boolean> => {
  const pkg = await Package.findOne({ _id: packageId, deleted_at: null });

  if (!pkg) {
    throw new Error('Không tìm thấy gói dịch vụ');
  }

  // Soft delete the package
  await Package.updateOne(
    { _id: packageId },
    { deleted_at: new Date(), status: 'inactive' }
  );

  // Soft delete related package details
  await PackageDetail.updateOne(
    { package_id: packageId, deleted_at: null },
    { deleted_at: new Date(), status: 'inactive' }
  );

  return true;
};

// Toggle package status (active/inactive)
export const togglePackageStatus = async (packageId: string): Promise<PackageResponse> => {
  const pkg = await Package.findOne({ _id: packageId, deleted_at: null });

  if (!pkg) {
    throw new Error('Không tìm thấy gói dịch vụ');
  }

  const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
  
  const updatedPackage = await Package.findByIdAndUpdate(
    packageId,
    { status: newStatus, updated_at: new Date() },
    { new: true }
  ).lean();

  if (!updatedPackage) {
    throw new Error('Không thể cập nhật trạng thái gói dịch vụ');
  }

  const packageDetail = await PackageDetail.findOne({
    package_id: packageId,
    deleted_at: null
  }).lean();

  return {
    _id: updatedPackage._id.toString(),
    name: updatedPackage.name,
    max_members: updatedPackage.max_members,
    price: updatedPackage.price,
    duration: updatedPackage.duration,
    description: updatedPackage.description,
    benefits: updatedPackage.benefits,
    status: updatedPackage.status,
    category: updatedPackage.category || 'basic',
    popular: updatedPackage.popular || false,
    training_sessions: updatedPackage.training_sessions || 0,
    session_duration: updatedPackage.session_duration || 60,
    created_at: updatedPackage.created_at,
    updated_at: updatedPackage.updated_at,
    packageDetail: packageDetail ? {
      schedule: packageDetail.schedule,
      training_areas: packageDetail.training_areas,
      additional_services: packageDetail.additional_services
    } : undefined
  };
};

// Get package statistics
export const getPackageStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  popular: number;
  withTrainingSessions: number;
}> => {
  const total = await Package.countDocuments({ deleted_at: null });
  const active = await Package.countDocuments({ status: 'active', deleted_at: null });
  const inactive = await Package.countDocuments({ status: 'inactive', deleted_at: null });
  const popular = await Package.countDocuments({ popular: true, deleted_at: null });
  const withTrainingSessions = await Package.countDocuments({ 
    training_sessions: { $gt: 0 }, 
    deleted_at: null 
  });

  // Get counts by category
  const categoryCounts = await Package.aggregate([
    { $match: { deleted_at: null } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const byCategory: Record<string, number> = {};
  categoryCounts.forEach(category => {
    byCategory[category._id || 'basic'] = category.count;
  });

  return {
    total,
    active,
    inactive,
    byCategory,
    popular,
    withTrainingSessions
  };
};

export default {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  getPackageStats,
};