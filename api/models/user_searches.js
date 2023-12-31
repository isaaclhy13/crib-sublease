const mongoose = require('mongoose');

const UserSearchesSchema = new mongoose.Schema ({
    time : {
        type: Date,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    coords: {
        type: Array,
        required: true
    },
    oneSignalID: {
        type: String,
        required: false
    },

})

module.exports = UserSearches = mongoose.model('userSearches', UserSearchesSchema) 
