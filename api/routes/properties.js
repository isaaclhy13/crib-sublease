const express = require("express");
const router = express.Router();

const PropertyController = require("../controller/properties");
const checkAuth = require("../middleware/check-auth");

//---------------Image Specific Code--------------------------
const multer = require("multer");

const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const { GridFsStorage } = require("multer-gridfs-storage");

const dbInstance = mongoose.connection;
mongoose.Promise = global.Promise;

const storage = new GridFsStorage({
    //url: mongoDB,
    db: dbInstance,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(32, (err, buff) => {
                if (err) return reject(err);
                const filename =
                    buff.toString("hex") + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: "propertyImages",
                };
                resolve(fileInfo);
            });
        });
    },
});

const upload = multer({ storage, limits: { fieldSize: 25 * 1024 * 1024 } });

//--------------------------------------------

const propertyPics = upload.fields([
    { name: "propImg1", maxCount: 1 },
    { name: "propImg2", maxCount: 1 },
    { name: "propImg3", maxCount: 1 },
    { name: "propImg4", maxCount: 1 },
    { name: "propImg5", maxCount: 1 },
]);

router.post(
    "/",
    upload.array("propertyImages", 5),
    checkAuth,
    PropertyController.property_create
);

router.post(
    "/scraped/images",
    upload.array("propertyImages", 5),
    upload.single("userImage"),
    PropertyController.property_scraped_images
);

router.post(
    "/scraped",
    PropertyController.property_scraped
);

router.get("/", PropertyController.property_get_all);
router.get("/pins", PropertyController.property_pins);
router.get("/propertyViewed/:id", PropertyController.increment_view_count);
router.get("/pins", PropertyController.property_pins);
router.get("/query", PropertyController.property_query);
router.get("/featured", PropertyController.featured_property_by_city);
router.post("/internal/subleased", checkAuth, PropertyController.sublease_successful);
router.post("/internal/subleasedwithcomments", checkAuth, PropertyController.sublease_successful_withcomments);
router.post("/internal/contact/fb", checkAuth, PropertyController.fb_contacts);
router.post("/favorite", checkAuth, PropertyController.property_favorite);
router.post("/:id", PropertyController.property_get_one);
router.put("/:id", checkAuth, PropertyController.property_modify);
router.get("/getAllNewYorkPosting", PropertyController.get_all_ny_properties)
router.get("/getAllNewYorkPostingLimit8", PropertyController.get_all_ny_properties_limit8)
router.post("/automate/addSubtenantRequests", PropertyController.add_subtenant_request)
router.post("/automate/getSubtenantRequests", PropertyController.get_subtenant_requests)

router.get("/getDetails/:id", PropertyController.property_get_one);

router.put(
    "/propertyImages/:id",
    upload.single("propertyImage"),
    checkAuth,
    PropertyController.property_modify_image
);
router.delete("/:id", checkAuth, PropertyController.property_delete);
router.get("/propertyImages/:filename", PropertyController.get_image);


module.exports = router;
