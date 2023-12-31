const jwt = require('jsonwebtoken');
const User = require("../models/user");
const ActivityLog = require("../models/activity_log");


module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decoded;
        console.log(token)
        await User.findByIdAndUpdate(decoded.userId, {
            lastActive: new Date(),
        });

        //store user activity log
        const log = new ActivityLog( 
            {
                userId: decoded.userId,
                time: new Date(),
                endpoint: req.originalUrl,
                body: req.body
            });
        log.save();

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
};