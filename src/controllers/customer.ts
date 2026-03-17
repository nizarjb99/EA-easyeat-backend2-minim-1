import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import CustomerService from '../services/customer';

const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
   

    try {
       const savedCustomer = await CustomerService.createCustomer(req.body);
        return res.status(201).json(savedCustomer);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readCustomer = async (req: Request, res: Response, next: NextFunction) => {
    const customerId = req.params.customerId;
    try {
        const customer = await CustomerService.getCustomer(customerId);
        return customer ? res.status(200).json(customer) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const readAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customers = await CustomerService.getAllCustomers();
        return res.status(200).json(customers);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    const customerId = req.params.customerId;
    try {
        const updatedCustomer = await CustomerService.updateCustomer(customerId, req.body);
        return updatedCustomer ? res.status(201).json(updatedCustomer) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};


const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    const customerId = req.params.customerId;

    try {
        const customer = await CustomerService.deleteCustomer(customerId);
        return customer ? res.status(201).json(customer) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createCustomer, readCustomer, readAll, updateCustomer, deleteCustomer };
