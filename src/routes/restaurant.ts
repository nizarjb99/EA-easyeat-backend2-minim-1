import express from 'express';
import controller from '../controllers/restaurant';
import { Schemas, ValidateJoi } from '../middleware/joi';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Restaurants
 *     description: CRUD endpoints for restaurants
 *
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *           example: "65f1c2a1b2c3d4e5f6789013"
 *         profile:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "La Pepita"
 *             description:
 *               type: string
 *               example: "Restaurant de cuina mediterrània"
 *             rating:
 *               type: number
 *               example: 4.5
 *             category:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Espanyol", "Taperia"]
 *             timetable:
 *               type: object
 *               description: Weekly timetable with open/close times
 *             image:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["https://example.com/image.jpg"]
 *             contact:
 *               type: object
 *               properties:
 *                 phone:
 *                   type: string
 *                   example: "+34 931 234 567"
 *                 email:
 *                   type: string
 *                   example: "info@lapepita.com"
 *             location:
 *               type: object
 *               required:
 *                 - city
 *                 - address
 *                 - coordinates
 *               properties:
 *                 city:
 *                   type: string
 *                   example: "Barcelona"
 *                 address:
 *                   type: string
 *                   example: "Carrer de Provença, 123"
 *                 googlePlaceId:
 *                   type: string
 *                   example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *                 coordinates:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "Point"
 *                     coordinates:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [2.1734, 41.3851]
 *         employees:
 *           type: array
 *           items:
 *             type: string
 *           example: ["65f1c2a1b2c3d4e5f6789012"]
 *         rewards:
 *           type: array
 *           items:
 *             type: string
 *           example: ["65f1c2a1b2c3d4e5f6789014"]
 *         statistics:
 *           type: string
 *           example: "65f1c2a1b2c3d4e5f6789015"
 *         badges:
 *           type: array
 *           items:
 *             type: string
 *           example: ["65f1c2a1b2c3d4e5f6789016"]
 *     RestaurantCreateUpdate:
 *       type: object
 *       required:
 *         - profile
 *       properties:
 *         profile:
 *           type: object
 *           required:
 *             - name
 *             - location
 *           properties:
 *             name:
 *               type: string
 *               example: "La Pepita"
 *             description:
 *               type: string
 *             category:
 *               type: array
 *               items:
 *                 type: string
 *             timetable:
 *               type: object
 *             image:
 *               type: array
 *               items:
 *                 type: string
 *             contact:
 *               type: object
 *               properties:
 *                 phone:
 *                   type: string
 *                 email:
 *                   type: string
 *             location:
 *               type: object
 *               required:
 *                 - city
 *                 - address
 *                 - coordinates
 *               properties:
 *                 city:
 *                   type: string
 *                 address:
 *                   type: string
 *                 googlePlaceId:
 *                   type: string
 *                 coordinates:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     coordinates:
 *                       type: array
 *                       items:
 *                         type: number
 */

/**
 * @openapi
 * /restaurants:
 *   post:
 *     summary: Creates a restaurant
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantCreateUpdate'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       422:
 *         description: Validation failed (Joi)
 */
router.post('/', ValidateJoi(Schemas.restaurant.create), controller.createRestaurant);

/**
 * @openapi
 * /restaurants:
 *   get:
 *     summary: Lists all restaurants
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 */
router.get('/', controller.readAll);

/**
 * @openapi
 * /restaurants/nearby:
 *   get:
 *     summary: Gets restaurants near a location (geospatial query)
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude
 *         example: 2.1734
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude
 *         example: 41.3851
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         description: Max distance in meters (default 5000)
 *         example: 2000
 *     responses:
 *       200:
 *         description: List of nearby restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Missing or invalid coordinates
 */
router.get('/nearby', controller.getNearby);

/**
 * @openapi
 * /restaurants/{restaurantId}:
 *   get:
 *     summary: Gets a restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The restaurant's ObjectId
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found
 */
router.get('/:restaurantId', controller.readRestaurant);

/**
 * @openapi
 * /restaurants/{restaurantId}/full:
 *   get:
 *     summary: Gets a restaurant with all populated fields (employees, rewards, badges, statistics)
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The restaurant's ObjectId
 *     responses:
 *       200:
 *         description: Restaurant with populated relations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found
 */
router.get('/:restaurantId/full', controller.getRestaurantFull);

/**
 * @openapi
 * /restaurants/{restaurantId}:
 *   put:
 *     summary: Updates a restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The restaurant's ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestaurantCreateUpdate'
 *     responses:
 *       200:
 *         description: Updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found
 *       422:
 *         description: Validation failed (Joi)
 */
router.put('/:restaurantId', ValidateJoi(Schemas.restaurant.update), controller.updateRestaurant);

/**
 * @openapi
 * /restaurants/{restaurantId}:
 *   delete:
 *     summary: Deletes a restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The restaurant's ObjectId
 *     responses:
 *       200:
 *         description: Successfully deleted
 *       404:
 *         description: Restaurant not found
 */
router.delete('/:restaurantId', controller.deleteRestaurant);

/**
 * @openapi
 * /restaurants/{restaurantId}/badges:
 *   get:
 *     summary: Gets all badges of a restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of badges
 *       404:
 *         description: Restaurant not found
 */
router.get('/:restaurantId/badges', controller.getBadges);

/**
 * @openapi
 * /restaurants/{restaurantId}/statistics:
 *   get:
 *     summary: Gets the statistics of a restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurant statistics
 *       404:
 *         description: Restaurant not found
 */
router.get('/:restaurantId/statistics', controller.getStatistics);

export default router;