import express from 'express';
import controller from '../controllers/resource';
import { Schemas, ValidateJoi } from '../middleware/joi';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Resources
 *     description: CRUD endpoints for Restaurant External Resources (Links)
 *
 * components:
 *   schemas:
 *     ResourceLinkCreateUpdate:
 *       type: object
 *       required:
 *         - url
 *         - type
 *         - description
 *       properties:
 *         url:
 *           type: string
 *           description: URL del recurso externo
 *           example: "https://youtube.com/watch?v=dQw4w9WgXcQ"
 *         type:
 *           type: string
 *           description: Tipo de recurso
 *           example: "Video"
 *         description:
 *           type: string
 *           description: Breve descripción del recurso
 *           example: "Recorrido por las instalaciones del restaurante"
 */

/**
 * @openapi
 * /resources/{restaurantId}:
 *   post:
 *     summary: Adds a new link to the restaurant's resource collection
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceLinkCreateUpdate'
 *     responses:
 *       201:
 *         description: Created link successfully
 *       422:
 *         description: Validation failed (Joi)
 */
router.post('/:restaurantId', ValidateJoi(Schemas.resourceItem.create), controller.createLink);

/**
 * @openapi
 * /resources/{restaurantId}:
 *   get:
 *     summary: Lists all external resource links for a restaurant
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of links
 */
router.get('/:restaurantId', controller.getLinks);

/**
 * @openapi
 * /resources/{restaurantId}/{linkId}:
 *   put:
 *     summary: Updates an existing resource link
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResourceLinkCreateUpdate'
 *     responses:
 *       200:
 *         description: Updated link
 *       404:
 *         description: Link or Restaurant not found
 *       422:
 *         description: Validation failed (Joi)
 */
router.put('/:restaurantId/:linkId', ValidateJoi(Schemas.resourceItem.update), controller.updateLink);

/**
 * @openapi
 * /resources/{restaurantId}/{linkId}:
 *   delete:
 *     summary: Deletes a resource link
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted success
 *       404:
 *         description: Not found
 */
router.delete('/:restaurantId/:linkId', controller.deleteLink);

export default router;
