const mongoose = require('mongoose')

const RequestSchema = new mongoose.Schema (
    {
        tenantId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        subtenantId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        propId: {
            type: mongoose.Types.ObjectId,
            required: true
        },
        envelopeId: {
            type: String,
            required: false
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        numberOfOccupants: {
            type: Number,
            required: true
        },
        about:{
            type: String,
            required:true
        },
        createdAt:{
            type: Date,
            required: true
        },
        accepted: {
            type: Boolean,
            required: true,
            index: true
        },
        timeAccepted:{
            type:Date,
            required: false
        },
        paid: {
            type: Boolean,
            required: true
        },
        tenantSignedContract: {
            type: Boolean,
            required: true
        },
        subtenantSignedContract: {
            type: Boolean,
            required: true
        }
    }
)
//delete the request object after 48 hours if the tenant doesnt accept
RequestSchema.index({createdAt: 1},{expireAfterSeconds: 60*60*24,partialFilterExpression : {accepted: false}});
module.exports = Request = mongoose.model('requests', RequestSchema)