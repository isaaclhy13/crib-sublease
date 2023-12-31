const express = require("express");
const router = express.Router();
const AutomationController = require('../controller/automation');

router.get("/instagram", AutomationController.automate_instagram);
//For those who are looking for sublease before April 17
router.get("/googleform", AutomationController.automate_google_form);

router.post("/cribconnectreminder", AutomationController.automate_crib_connect_reminder)

router.get("/didntpaycribconnect", AutomationController.automate_didnt_pay_crib_connect)

router.get("/nondeletedprops", AutomationController.get_non_deleted_props)

router.post("/tenantautomation", AutomationController.tenant_automation)

// router.get("/subtenantarrayautomation", AutomationController.subtenant_arr_automation)

router.post("/generatesubtenantarrayforuser", AutomationController.automate_subtenant_array_for_user)

router.delete("/deleteSubtenant/:id", AutomationController.delete_subtenant)

router.get("/cribconnectDailySubtenantReminder", AutomationController.crib_connect_daily_reminder_subtenant)

router.get("/oneSignalCribConnectReminder", AutomationController.oneSingal_CribConnect_Reminder)

router.get("/cribConnectUserInfo", AutomationController.automate_crib_connect_users)

router.post("/subtenantSMSResponse", AutomationController.automate_subtenant_sms_response)

router.get("/checkcontact", AutomationController.check_contact)

module.exports = router;