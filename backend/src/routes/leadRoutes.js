const express = require('express');
const leadController = require('../controllers/leadController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

// Import leads from Excel
router.post('/import', authMiddleware, roleMiddleware('ADMIN'), leadController.importLeads);

// Get all leads
router.get('/', authMiddleware, leadController.getAllLeads);

// Assign leads to telepros
router.post('/assign', authMiddleware, roleMiddleware('ADMIN'), leadController.assignLeads);

// Get leads assigned to the logged-in telepro
router.get('/my', authMiddleware, leadController.getMyLeads);

// Update lead status and comments
router.put('/:id', authMiddleware, leadController.updateLead);

module.exports = router;