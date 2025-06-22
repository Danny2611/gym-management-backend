import Payment, { IPayment } from '../../models/Payment';
import { Types } from 'mongoose';


// Define types for query options and response
export interface PaymentQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: 'qr' | 'credit' | 'napas' | 'undefined';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PaymentResponse {
  _id: string;
  member: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  package: {
    _id: string;
    name: string;
    price: number;
    duration: number;
    training_sessions: number;
  };
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'qr' | 'credit' | 'napas' | 'undefined';
  paymentInfo?: any;
  transactionId?: string;
  created_at: Date;
  updated_at: Date;
}

// Get all payments with pagination, filtering and sorting
export const getAllPayments = async (
  options: PaymentQueryOptions
): Promise<{
  payments: PaymentResponse[];
  totalPayments: number;
  totalPages: number;
  currentPage: number;
}> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    paymentMethod,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
  } = options;

  const query: any = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by payment method
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    query.created_at = {};
    if (dateFrom) {
      query.created_at.$gte = dateFrom;
    }
    if (dateTo) {
      query.created_at.$lte = dateTo;
    }
  }

  const totalPayments = await Payment.countDocuments(query);
  const totalPages = Math.ceil(totalPayments / limit);

  const sort: any = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.created_at = -1;
  }

  const payments = await Payment.find(query)
    .populate('member_id', 'name email avatar')
    .populate('package_id', 'name price duration training_sessions')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Search in populated member name, email, transaction ID
  let filteredPayments = payments;
  if (search) {
    filteredPayments = payments.filter((payment) => {
      const memberName = (payment.member_id as any).name?.toLowerCase() || '';
      const memberEmail = (payment.member_id as any).email?.toLowerCase() || '';
      const packageName = (payment.package_id as any).name?.toLowerCase() || '';
      const transactionId = payment.transactionId?.toLowerCase() || '';
      
      return (
        memberName.includes(search.toLowerCase()) ||
        memberEmail.includes(search.toLowerCase()) ||
        packageName.includes(search.toLowerCase()) ||
        transactionId.includes(search.toLowerCase())
      );
    });
  }

  const paymentResponses: PaymentResponse[] = filteredPayments.map((payment) => ({
    _id: (payment._id as Types.ObjectId).toString(),
    member: {
      _id: (payment.member_id as any)._id.toString(),
      name: (payment.member_id as any).name,
      email: (payment.member_id as any).email,
      avatar: (payment.member_id as any).avatar,
    },
    package: {
      _id: (payment.package_id as any)._id.toString(),
      name: (payment.package_id as any).name,
      price: (payment.package_id as any).price,
      duration: (payment.package_id as any).duration,
      training_sessions: (payment.package_id as any).training_sessions,
    },
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentInfo: payment.paymentInfo,
    transactionId: payment.transactionId,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  }));

  return {
    payments: paymentResponses,
    totalPayments,
    totalPages,
    currentPage: page,
  };
};

// Get payment by ID
export const getPaymentById = async (paymentId: string): Promise<PaymentResponse> => {
  const payment = await Payment.findById(paymentId)
    .populate('member_id', 'name email avatar')
    .populate('package_id', 'name price duration training_sessions')
    .lean();

  if (!payment) {
    throw new Error('Không tìm thấy thanh toán');
  }

  return {
    _id: (payment._id as Types.ObjectId).toString(),
    member: {
      _id: (payment.member_id as any)._id.toString(),
      name: (payment.member_id as any).name,
      email: (payment.member_id as any).email,
      avatar: (payment.member_id as any).avatar,
    },
    package: {
      _id: (payment.package_id as any)._id.toString(),
      name: (payment.package_id as any).name,
      price: (payment.package_id as any).price,
      duration: (payment.package_id as any).duration,
      training_sessions: (payment.package_id as any).training_sessions,
    },
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentInfo: payment.paymentInfo,
    transactionId: payment.transactionId,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
};

// Update payment status
export const updatePaymentStatus = async (
  paymentId: string,
  status: 'pending' | 'completed' | 'failed' | 'cancelled',
  transactionId?: string
): Promise<PaymentResponse> => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error('Không tìm thấy thanh toán');
  }

  // Update payment status and transaction ID
  payment.status = status;
  if (transactionId) {
    payment.transactionId = transactionId;
  }
  payment.updated_at = new Date();

  await payment.save();

  // Return updated payment with populated fields
  return await getPaymentById(paymentId);
};

// Get payments by member ID
export const getPaymentsByMemberId = async (
  memberId: string,
  options: Omit<PaymentQueryOptions, 'search'> = {}
): Promise<{
  payments: PaymentResponse[];
  totalPayments: number;
  totalPages: number;
  currentPage: number;
}> => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentMethod,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
  } = options;

  const query: any = { member_id: memberId };

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by payment method
  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  // Filter by date range
  if (dateFrom || dateTo) {
    query.created_at = {};
    if (dateFrom) {
      query.created_at.$gte = dateFrom;
    }
    if (dateTo) {
      query.created_at.$lte = dateTo;
    }
  }

  const totalPayments = await Payment.countDocuments(query);
  const totalPages = Math.ceil(totalPayments / limit);

  const sort: any = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort.created_at = -1;
  }

  const payments = await Payment.find(query)
    .populate('member_id', 'name email avatar')
    .populate('package_id', 'name price duration training_sessions')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const paymentResponses: PaymentResponse[] = payments.map((payment) => ({
    _id: (payment._id as Types.ObjectId).toString(),
    member: {
      _id: (payment.member_id as any)._id.toString(),
      name: (payment.member_id as any).name,
      email: (payment.member_id as any).email,
      avatar: (payment.member_id as any).avatar,
    },
    package: {
      _id: (payment.package_id as any)._id.toString(),
      name: (payment.package_id as any).name,
      price: (payment.package_id as any).price,
      duration: (payment.package_id as any).duration,
      training_sessions: (payment.package_id as any).training_sessions,
    },
    amount: payment.amount,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    paymentInfo: payment.paymentInfo,
    transactionId: payment.transactionId,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  }));

  return {
    payments: paymentResponses,
    totalPayments,
    totalPages,
    currentPage: page,
  };
};

// Get payment statistics
export const getPaymentStatistics = async (): Promise<{
  total: number;
  pending: number;
  completed: number;
  failed: number;
  cancelled: number;
  totalRevenue: number;
  completedRevenue: number;
  paymentMethods: {
    qr: number;
    credit: number;
    napas: number;
    undefined: number;
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
}> => {
  const total = await Payment.countDocuments();
  const pending = await Payment.countDocuments({ status: 'pending' });
  const completed = await Payment.countDocuments({ status: 'completed' });
  const failed = await Payment.countDocuments({ status: 'failed' });
  const cancelled = await Payment.countDocuments({ status: 'cancelled' });

  // Calculate total revenue and completed revenue
  const revenueStats = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  let totalRevenue = 0;
  let completedRevenue = 0;

  revenueStats.forEach((stat) => {
    totalRevenue += stat.totalAmount;
    if (stat._id === 'completed') {
      completedRevenue = stat.totalAmount;
    }
  });

  // Payment methods statistics
  const paymentMethodStats = await Payment.aggregate([
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
      },
    },
  ]);

  const paymentMethods = {
    qr: 0,
    credit: 0,
    napas: 0,
    undefined: 0,
  };

  paymentMethodStats.forEach((stat) => {
    if (stat._id in paymentMethods) {
      paymentMethods[stat._id as keyof typeof paymentMethods] = stat.count;
    }
  });

  // Monthly revenue for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyStats = await Payment.aggregate([
    {
      $match: {
        created_at: { $gte: twelveMonthsAgo },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
      },
    },
  ]);

  const monthlyRevenue = monthlyStats.map((stat) => ({
    month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
    revenue: stat.revenue,
    count: stat.count,
  }));

  return {
    total,
    pending,
    completed,
    failed,
    cancelled,
    totalRevenue,
    completedRevenue,
    paymentMethods,
    monthlyRevenue,
  };
};

export default {
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentsByMemberId,
  getPaymentStatistics,
};