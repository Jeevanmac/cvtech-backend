const express = require('express');
const router = express.Router();
const { 
    getUserPurchases, 
    revokePurchaseAccess, 
    restorePurchaseAccess, 
    flagPurchase, 
    deletePurchase 
} = require('../controllers/adminPurchaseController');
const { protect, admin } = require('../middleware/auth');

// All routes are protected and require admin role
router.use(protect);
router.use(admin);

router.get('/users/:id/purchases', getUserPurchases);
router.patch('/purchases/:purchaseId/revoke', revokePurchaseAccess);
router.patch('/purchases/:purchaseId/restore', restorePurchaseAccess);
router.patch('/purchases/:purchaseId/flag', flagPurchase);
router.delete('/purchases/:purchaseId', deletePurchase);

module.exports = router;
