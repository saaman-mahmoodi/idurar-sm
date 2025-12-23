const express = require('express');
const rateLimit = require('express-rate-limit');
const { catchErrors } = require('@/handlers/errorHandlers');
const leadController = require('@/controllers/appControllers/leadController');

const router = express.Router();

// Rate limiting for lead generation - max 10 requests per day per user
const generateLeadsLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many lead generation requests. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lead generation routes
router.post('/leads/generate', generateLeadsLimiter, catchErrors(leadController.generate));
router.get('/leads', catchErrors(leadController.list));
router.delete('/leads/delete/:id', catchErrors(leadController.delete));
router.get('/leads/stats', catchErrors(leadController.stats));

module.exports = router;
