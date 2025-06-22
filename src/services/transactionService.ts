// services/transactionService.ts
import { RecentTransactionDTO } from '../types/transaction';
import Payment, { IPayment } from '../models/Payment';
import { Types } from 'mongoose';

interface PaymentFilters {
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: 'qr' | 'credit' | 'napas' | 'undefined';
  startDate?: Date | string;
  endDate?: Date | string;
}

// Get all transactions for a member with filters
const getAllMemberTransactions = async (
  memberId: Types.ObjectId | string,
  filters: PaymentFilters = {}
): Promise<any[]> => {
  try {
    // Convert string ID to ObjectId if needed
    const memberObjectId = typeof memberId === 'string' 
      ? new Types.ObjectId(memberId) 
      : memberId;
    
    // Build query based on filters
    const query: any = {
      member_id: memberObjectId,
    };
    
    // Add status filter if provided
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Add payment method filter if provided
    if (filters.paymentMethod) {
      query.paymentMethod = filters.paymentMethod;
    }
    
    // Add date range filter if provided
    if (filters.startDate || filters.endDate) {
      query.created_at = {};
      if (filters.startDate) {
        query.created_at.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.created_at.$lte = new Date(filters.endDate);
      }
    }
    
    // Get transactions with populated data
    const transactions = await Payment.find(query)
      .populate('package_id', 'name price category')
      .sort({ created_at: -1 }) // Sort by newest first
      .exec();
    
    // Format payments for frontend
    return transactions.map(transaction => formatTransactionForFrontend(transaction));
  } catch (error) {
    console.error('Error fetching member transactions:', error);
    throw new Error('Failed to fetch member transactions');
  }
};



// Get transaction details by ID
const getTransactionById = async (
  transactionId: Types.ObjectId | string,
 
): Promise<IPayment | null> => {
  try {
    // Convert string IDs to ObjectId if needed
    const transactionObjectId = typeof transactionId === 'string' 
      ? new Types.ObjectId(transactionId) 
      : transactionId;
      
   
    
    // Find transaction with populated data
    const transaction = await Payment.findOne({
      _id: transactionObjectId,
    })
      .populate('member_id', 'name avatar email phone')
      .populate('package_id', 'name price category description duration')
      .exec();

    if (!transaction) {
      throw new Error('Transaction not found or does not belong to this member');
    }

    return transaction;
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    throw new Error('Failed to fetch transaction details');
  }
};

// Helper function to format transaction data for frontend
const formatTransactionForFrontend = (transaction: IPayment): any => {
    return {
      _id: transaction._id,
      packageName: (transaction.package_id as any)?.name || 'Unknown Package',
      amount: transaction.amount,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      transactionId: transaction.transactionId || 'N/A',
      date: transaction.created_at,
      paymentInfo: transaction.paymentInfo || {}
    };
  };

 const getRecentSuccessfulTransactions = async (
  memberId: string
): Promise<RecentTransactionDTO[]> => {
  try {
    const transactions = await Payment.find({ 
      status: 'completed',
      member_id: memberId
    })
      .sort({ created_at: -1 })
      .limit(5)
      .populate('package_id', 'name') // populate tên gói tập
      .exec();

    return transactions.map(transaction => ({
      amount: transaction.amount,
      created_at: transaction.created_at,
      packageName: (transaction.package_id as any)?.name || null
    }));
  } catch (error) {
    console.error('Error fetching recent successful transactions:', error);
    throw new Error('Failed to fetch recent successful transactions');
  }
};

  
  export default {
    getAllMemberTransactions,
    getTransactionById,
    getRecentSuccessfulTransactions
  };