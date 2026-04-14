import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // needed to read httpOnly refresh cookie
import { config } from './config/config';
import Logging from './library/logging';
import { insertData } from './utils/dataSeeder';

import restaurantRoutes from './routes/restaurant';
import reviewRoutes from './routes/review';
import customerRoutes from './routes/customer';
import rewardRoutes from './routes/reward';
import visitRoutes from './routes/visit';
import badgeRoutes from './routes/badge';
import dishRoutes from './routes/dish';
import employeeRoutes from './routes/employee';
import pointsWallets from './routes/pointsWallet';
import rewardRedemption from './routes/rewardRedemption';
import statistics from './routes/statistics';
import resourceRoutes from './routes/resource';

import authRoutes from './routes/auth';
// requireAdmin is now an array [authenticate, requireRole('admin')]
import { requireAdmin } from './middleware/auth';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

const router = express();

mongoose
    .connect(config.mongo.url, { retryWrites: true, w: 'majority' })
    .then(async () => {
        Logging.info('Mongo connected successfully.');
        await insertData();
        StartServer();
    })
    .catch((error) => Logging.error(error));

const StartServer = () => {
    router.use((req, res, next) => {
        Logging.info(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);
        res.on('finish', () => {
            Logging.info(`Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`);
        });
        next();
    });

    router.use(express.urlencoded({ extended: true }));
    router.use(express.json());
    router.use(cookieParser()); // must be before any route that reads cookies
    router.use(cors());

    /** Swagger — public */
    router.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    /** Public Routes */
    router.use('/auth', authRoutes);
    router.get('/ping', (_req, res) => res.status(200).json({ hello: 'world' }));

    /** Protected Routes — requireAdmin = [authenticate, requireRole('admin')] */
    router.use('/restaurants',      requireAdmin, restaurantRoutes);
    router.use('/reviews',          requireAdmin, reviewRoutes);
    router.use('/customers',        requireAdmin, customerRoutes);
    router.use('/rewards',          requireAdmin, rewardRoutes);
    router.use('/visits',           requireAdmin, visitRoutes);
    router.use('/badges',           requireAdmin, badgeRoutes);
    router.use('/dishes',           requireAdmin, dishRoutes);
    router.use('/employees',        requireAdmin, employeeRoutes);
    router.use('/pointsWallets',    requireAdmin, pointsWallets);
    router.use('/rewardRedemptions',requireAdmin, rewardRedemption);
    router.use('/statistics',       requireAdmin, statistics);
    router.use('/resources',        requireAdmin, resourceRoutes);

    /** 404 fallback */
    router.use((req, res) => {
        Logging.error(new Error(`Not found: ${req.url}`));
        res.status(404).json({ message: 'Not found' });
    });

    http.createServer(router).listen(config.server.port, () =>
        Logging.info(`Server is running on port ${config.server.port}`)
    );
};
