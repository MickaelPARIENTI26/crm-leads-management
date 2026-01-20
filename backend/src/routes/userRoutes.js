const express = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// Route to create a new user (Admin only)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createUser);

// Route to get all users (Admin only)
router.get('/', authMiddleware, roleMiddleware('ADMIN'), getUsers);

// Route to get a user by ID (Admin only)
router.get('/:id', authMiddleware, roleMiddleware('ADMIN'), getUserById);

// Route to update a user (Admin only)
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), updateUser);

// Route to delete a user (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), deleteUser);

module.exports = router;