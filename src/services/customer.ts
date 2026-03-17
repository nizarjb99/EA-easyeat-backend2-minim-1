import mongoose from 'mongoose';
import { CustomerModel, ICustomer } from '../models/customer';


const createCustomer = async (data: Partial<ICustomer>) => {
    const customer = new CustomerModel({
        _id: new mongoose.Types.ObjectId(),
        ...data
    });
    return await customer.save();
};

const getCustomer = async (customerId: string) => {
    return await CustomerModel.findById(customerId);
};

const getAllCustomers = async () => {
    return await CustomerModel.find();
};


const updateCustomer = async (customerId: string, data: Partial<ICustomer>) => {
    const customer = await CustomerModel.findById(customerId);

    if (customer) {
        customer.set(data);
        return await customer.save();
    }

    return null;
};


const deleteCustomer = async (customerId: string) => {
    return await CustomerModel.findByIdAndDelete(customerId);
};

export default { createCustomer, getCustomer, getAllCustomers, updateCustomer, deleteCustomer };
