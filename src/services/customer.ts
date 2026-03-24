import mongoose from 'mongoose';
import { CustomerModel, ICustomer } from '../models/customer';
import { softDeleteDocument, restoreDocument } from '../utils/softDelete';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationOptions {
    page?:  number;   // 1-based, default 1
    limit?: number;   // default 20
}

export interface PaginatedResult<T> {
    data: T[]; total: number;
    page: number;
    totalPages: number;
}

// ─── Create ───────────────────────────────────────────────────────────────────

const createCustomer = async (data: Partial<ICustomer>) => {
    const customer = new CustomerModel({
        _id: new mongoose.Types.ObjectId(),
        ...data,
    });
    return customer.save();
};

// ─── Read (single) ────────────────────────────────────────────────────────────

const getCustomer = async (customerId: string, includeDeleted = false) => {
    const query = CustomerModel.findById(customerId).populate({ path: 'visitHistory', populate: { path: 'restaurant_id' } });
    return includeDeleted ? query : query.active();
};

// ─── Read (paginated list — active only) ──────────────────────────────────────

const getAllCustomers = async ( { page = 1, limit = 20 }: PaginationOptions = {} ): Promise<PaginatedResult<ICustomer>> => {
    const skip   = (page - 1) * limit;
    const filter = { deletedAt: null };
    const [data, total] = await Promise.all([ CustomerModel.find(filter).skip(skip).limit(limit).lean(), CustomerModel.countDocuments(filter) ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

// ─── Update ───────────────────────────────────────────────────────────────────

const updateCustomer = async (customerId: string, data: Partial<ICustomer>) => {
    const customer = await CustomerModel.findOne({ _id: customerId }).active();
    if (!customer) return null;
    customer.set(data);
    return customer.save();
};

// ─── Soft Delete ──────────────────────────────────────────────────────────────

const softDeleteCustomer = async (customerId: string) => {
    return softDeleteDocument(CustomerModel, customerId);
};

// ─── Restore ─────────────────────────────────────────────────────────────────

const restoreCustomer = async (customerId: string) => {
    return restoreDocument(CustomerModel, customerId);
};

// ─── Hard Delete ─────────────────────────────────────────────────────────────

const hardDeleteCustomer = async (customerId: string) => {
    return CustomerModel.findByIdAndDelete(customerId);
};

export default {
    createCustomer,
    getCustomer,
    getAllCustomers,
    updateCustomer,
    softDeleteCustomer,
    restoreCustomer,
    hardDeleteCustomer,
};