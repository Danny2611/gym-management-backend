import Promotion, { IPromotion } from '~/models/Promotion';
import Membership from '~/models/Membership';
import Package from '~/models/Package';
import { Types } from 'mongoose';
import { isWithinInterval, isBefore, isAfter } from 'date-fns';

// Define types for query options and response
export interface PromotionQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PromotionResponse {
  _id: string;
  name: string;
  description?: string;
  discount: number;
  start_date: Date;
  end_date: Date;
  status: 'active' | 'inactive';
  applicable_packages: {
    _id: string;
    name: string;
    price: number;
  }[];
  created_at: Date;
  updated_at: Date;
}

export interface CreatePromotionData {
  name: string;
  description?: string;
  discount: number;
  start_date: Date;
  end_date: Date;
  status?: 'active' | 'inactive';
  applicable_packages: string[];
}

export interface UpdatePromotionData {
  name?: string;
  description?: string;
  discount?: number;
  start_date?: Date;
  end_date?: Date;
  status?: 'active' | 'inactive';
  applicable_packages?: string[];
}

export interface PromotionEffectiveness {
  promotion_id: string;
  promotion_name: string;
  promotion_period: {
    start_date: Date;
    end_date: Date;
  };
  package_stats: {
    package_id: string;
    package_name: string;
    total_memberships: number;
    total_revenue: number;
    conversion_rate: number;
  }[];
  total_memberships: number;
  total_revenue: number;
  average_conversion_rate: number;
}

// Get all promotions with pagination, filtering and sorting
export const getAllPromotions = async (
  options: PromotionQueryOptions
): Promise<{
  promotions: PromotionResponse[];
  totalPromotions: number;
  totalPages: number;
  currentPage: number;
}> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    sortBy,
    sortOrder,
  } = options;

  const query: any = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Search by name or description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const totalPromotions = await Promotion.countDocuments(query);
  const totalPages = Math.ceil(totalPromotions / limit);

  const sort: any = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.created_at = -1;
  }

  const promotions = await Promotion.find(query)
    .populate('applicable_packages', 'name price')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const promotionResponses: PromotionResponse[] = promotions.map((promotion) => ({
    _id: (promotion._id as Types.ObjectId).toString(),
    name: promotion.name,
    description: promotion.description,
    discount: promotion.discount,
    start_date: promotion.start_date,
    end_date: promotion.end_date,
    status: promotion.status,
   applicable_packages: Array.isArray(promotion.applicable_packages)
  ? promotion.applicable_packages.map((pkg: any) => ({
      _id: pkg._id?.toString?.() || '',
      name: pkg.name || '',
      price: pkg.price || 0,
    }))
  : [],

    created_at: promotion.created_at,
    updated_at: promotion.updated_at,
  }));

  return {
    promotions: promotionResponses,
    totalPromotions,
    totalPages,
    currentPage: page,
  };
};

// Get promotion by ID
export const getPromotionById = async (promotionId: string): Promise<PromotionResponse> => {
  const promotion = await Promotion.findById(promotionId)
    .populate('applicable_packages', 'name price')
    .lean();

  if (!promotion) {
    throw new Error('Không tìm thấy chương trình khuyến mãi');
  }

  return {
    _id: (promotion._id as Types.ObjectId).toString(),
    name: promotion.name,
    description: promotion.description,
    discount: promotion.discount,
    start_date: promotion.start_date,
    end_date: promotion.end_date,
    status: promotion.status,
    applicable_packages: (promotion.applicable_packages as any[]).map((pkg) => ({
      _id: pkg._id.toString(),
      name: pkg.name,
      price: pkg.price,
    })),
    created_at: promotion.created_at,
    updated_at: promotion.updated_at,
  };
};

// Create new promotion
export const createPromotion = async (promotionData: CreatePromotionData): Promise<PromotionResponse> => {
  // Validate dates
  if (isBefore(promotionData.end_date, promotionData.start_date)) {
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
  }

  // Validate discount
  if (promotionData.discount <= 0 || promotionData.discount > 100) {
    throw new Error('Phần trăm giảm giá phải từ 1% đến 100%');
  }

  // Validate applicable packages exist
  const packageIds = promotionData.applicable_packages.map(id => new Types.ObjectId(id));
  const existingPackages = await Package.countDocuments({ _id: { $in: packageIds } });
  
  if (existingPackages !== packageIds.length) {
    throw new Error('Một hoặc nhiều gói không tồn tại');
  }

  const newPromotion = new Promotion({
    ...promotionData,
    applicable_packages: packageIds,
  });

  const savedPromotion = await newPromotion.save();
return getPromotionById((savedPromotion._id as Types.ObjectId).toString());

};

// Update promotion
export const updatePromotion = async (
  promotionId: string,
  updateData: UpdatePromotionData
): Promise<PromotionResponse> => {
  const promotion = await Promotion.findById(promotionId);

  if (!promotion) {
    throw new Error('Không tìm thấy chương trình khuyến mãi');
  }

  // Validate dates if provided
  const startDate = updateData.start_date || promotion.start_date;
  const endDate = updateData.end_date || promotion.end_date;
  
  if (isBefore(endDate, startDate)) {
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
  }

  // Validate discount if provided
  if (updateData.discount !== undefined) {
    if (updateData.discount <= 0 || updateData.discount > 100) {
      throw new Error('Phần trăm giảm giá phải từ 1% đến 100%');
    }
  }

  // Validate applicable packages if provided
  if (updateData.applicable_packages) {
    const packageIds = updateData.applicable_packages.map(id => new Types.ObjectId(id));
    const existingPackages = await Package.countDocuments({ _id: { $in: packageIds } });
    
    if (existingPackages !== packageIds.length) {
      throw new Error('Một hoặc nhiều gói không tồn tại');
    }
    
    updateData.applicable_packages = packageIds as any;
  }

  const updatedPromotion = await Promotion.findByIdAndUpdate(
    promotionId,
    { ...updateData, updated_at: new Date() },
    { new: true }
  );

  return getPromotionById((updatedPromotion!._id as Types.ObjectId).toString());

  
};

// Delete promotion
export const deletePromotion = async (promotionId: string): Promise<boolean> => {
  const promotion = await Promotion.findById(promotionId);

  if (!promotion) {
    throw new Error('Không tìm thấy chương trình khuyến mãi');
  }

  // Check if promotion is currently active
  const now = new Date();
  const isCurrentlyActive = promotion.status === 'active' && 
    isWithinInterval(now, { start: promotion.start_date, end: promotion.end_date });

  if (isCurrentlyActive) {
    throw new Error('Không thể xóa chương trình khuyến mãi đang hoạt động');
  }

  await Promotion.deleteOne({ _id: promotionId });
  return true;
};

// Get promotion effectiveness
export const getPromotionEffectiveness = async (promotionId: string): Promise<PromotionEffectiveness> => {
  const promotion = await Promotion.findById(promotionId)
    .populate('applicable_packages', 'name price')
    .lean();

  if (!promotion) {
    throw new Error('Không tìm thấy chương trình khuyến mãi');
  }

 const packageStats: PromotionEffectiveness['package_stats'] = [];

  
  let totalMemberships = 0;
  let totalRevenue = 0;

  // Analyze each applicable package
  for (const pkg of promotion.applicable_packages as any[]) {
    // Count memberships created during promotion period for this package
    const memberships = await Membership.find({
      package_id: pkg._id,
      created_at: {
        $gte: promotion.start_date,
        $lte: promotion.end_date,
      }
    }).lean();

    const packageMemberships = memberships.length;
    const packageRevenue = packageMemberships * pkg.price * (1 - promotion.discount / 100);

    // Calculate conversion rate (simplified - based on package popularity)
    // You might want to implement more sophisticated conversion tracking
    const totalPackageMemberships = await Membership.countDocuments({ package_id: pkg._id });
    const conversionRate = totalPackageMemberships > 0 
      ? (packageMemberships / totalPackageMemberships) * 100 
      : 0;

    packageStats.push({
      package_id: pkg._id.toString(),
      package_name: pkg.name,
      total_memberships: packageMemberships,
      total_revenue: packageRevenue,
      conversion_rate: parseFloat(conversionRate.toFixed(2)),
    });

    totalMemberships += packageMemberships;
    totalRevenue += packageRevenue;
  }

  const averageConversionRate = packageStats.length > 0
    ? parseFloat((packageStats.reduce((sum, stat) => sum + stat.conversion_rate, 0) / packageStats.length).toFixed(2))
    : 0;

  return {
    promotion_id: promotion._id.toString(),
    promotion_name: promotion.name,
    promotion_period: {
      start_date: promotion.start_date,
      end_date: promotion.end_date,
    },
    package_stats: packageStats,
    total_memberships: totalMemberships,
    total_revenue: parseFloat(totalRevenue.toFixed(2)),
    average_conversion_rate: averageConversionRate,
  };
};

// Get active promotions for a specific package
export const getActivePromotionsForPackage = async (packageId: string): Promise<PromotionResponse[]> => {
  const now = new Date();
  
  const activePromotions = await Promotion.find({
    applicable_packages: new Types.ObjectId(packageId),
    status: 'active',
    start_date: { $lte: now },
    end_date: { $gte: now },
  })
  .populate('applicable_packages', 'name price')
  .lean();

  return activePromotions.map((promotion) => ({
    _id: (promotion._id as Types.ObjectId).toString(),
    name: promotion.name,
    description: promotion.description,
    discount: promotion.discount,
    start_date: promotion.start_date,
    end_date: promotion.end_date,
    status: promotion.status,
    applicable_packages: (promotion.applicable_packages as any[]).map((pkg) => ({
      _id: pkg._id.toString(),
      name: pkg.name,
      price: pkg.price,
    })),
    created_at: promotion.created_at,
    updated_at: promotion.updated_at,
  }));
};

// Get promotion statistics
export const getPromotionStats = async (): Promise<{
  total: number;
  active: number;
  inactive: number;
  expiredThisMonth: number;
  upcomingThisMonth: number;
}> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const total = await Promotion.countDocuments();
  const active = await Promotion.countDocuments({
    status: 'active',
    start_date: { $lte: now },
    end_date: { $gte: now },
  });
  const inactive = await Promotion.countDocuments({ status: 'inactive' });
  
  const expiredThisMonth = await Promotion.countDocuments({
    end_date: {
      $gte: startOfMonth,
      $lte: endOfMonth,
      $lt: now,
    }
  });

  const upcomingThisMonth = await Promotion.countDocuments({
    start_date: {
      $gte: now,
      $lte: endOfMonth,
    }
  });

  return {
    total,
    active,
    inactive,
    expiredThisMonth,
    upcomingThisMonth,
  };
};

// Auto-update promotion status based on dates
export const updatePromotionStatuses = async (): Promise<void> => {
  const now = new Date();

  // Deactivate expired promotions
  await Promotion.updateMany(
    {
      status: 'active',
      end_date: { $lt: now }
    },
    {
      status: 'inactive',
      updated_at: now
    }
  );

  // You could also activate promotions that should start now
  // But this might need manual approval in business logic
};

export default {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionEffectiveness,
  getActivePromotionsForPackage,
  getPromotionStats,
  updatePromotionStatuses,
};