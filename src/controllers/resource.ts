import { NextFunction, Request, Response } from 'express';
import ResourceService from '../services/resource';

const createLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { restaurantId } = req.params;
        const saved = await ResourceService.createLink(restaurantId, req.body);
        return res.status(201).json(saved);
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const getLinks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { restaurantId } = req.params;
        const links = await ResourceService.getLinks(restaurantId);
        return res.status(200).json(links);
    } catch (error) {
        return res.status(500).json({ error });
    }
};


const updateLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { restaurantId, linkId } = req.params;
        const updated = await ResourceService.updateLink(restaurantId, linkId, req.body);
        return updated ? res.status(200).json(updated) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

const deleteLink = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { restaurantId, linkId } = req.params;
        const deleted = await ResourceService.deleteLink(restaurantId, linkId);
        return deleted ? res.status(200).json(deleted) : res.status(404).json({ message: 'not found' });
    } catch (error) {
        return res.status(500).json({ error });
    }
};

export default { createLink, getLinks, updateLink, deleteLink };
