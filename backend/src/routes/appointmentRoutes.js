const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Create appointment (admin and telepro)
router.post('/', authMiddleware, roleMiddleware('ADMIN', 'TELEPRO'), appointmentController.createAppointment);

// Get all appointments (admin and telepro)
router.get('/', authMiddleware, roleMiddleware('ADMIN', 'TELEPRO'), appointmentController.getAllAppointments);

// Get my appointments (telepro)
router.get('/my', authMiddleware, roleMiddleware('TELEPRO'), appointmentController.getMyAppointments);

// Update appointment (admin and telepro who created it)
router.put('/:id', authMiddleware, roleMiddleware('ADMIN', 'TELEPRO'), appointmentController.updateAppointment);

// Delete appointment (admin and telepro who created it)
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN', 'TELEPRO'), appointmentController.deleteAppointment);

module.exports = router;
