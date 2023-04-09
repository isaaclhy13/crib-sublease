const express = require("express");
const router = express.Router();
const WebsiteController = require('../controller/lead');
const checkAuth = require("../middleware/check-auth");


router.post("/iosleads", WebsiteController.ios_leads)
router.post("/androidleads", WebsiteController.android_leads)
router.post("/leads", WebsiteController.collect_leads);
router.get("/leads", WebsiteController.get_leads);
// router.post("/generateFacebookPost",checkAuth, WebsiteController.gen_fb_post);

module.exports = router; 