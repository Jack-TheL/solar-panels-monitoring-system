// api/index.js
const express = require('express');

const reportsDataRoutes = require('./reportsDataRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const panelRoutes = require('./panelRouters');
const loginRoutes = require('./loginRoutes');
const homeRoutes = require('./homeRoutes');
const alertRoutes = require('./alertRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// ใช้งาน routes
router.use('/api', reportsDataRoutes);
router.use('/api', dashboardRoutes);
router.use('/api', loginRoutes);
router.use('/api', panelRoutes);
router.use('/api', homeRoutes);
router.use('/api', userRoutes);
router.use('/api', alertRoutes);

module.exports = router; // Export the router
