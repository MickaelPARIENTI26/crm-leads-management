const express = require('express');
const { createUser, getUsers } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// Route to create a new user (Admin only)
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createUser);

// Route to get all users (Admin only)
router.get('/', authMiddleware, roleMiddleware('ADMIN'), getUsers);

module.exports = router;