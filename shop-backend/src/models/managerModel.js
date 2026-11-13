const mongoose = require("mongoose"); 

const managerSchema = new mongoose.Schema({ 

    username: { 
        type: String,
        required: true, 
        unique: true, 
        trim: true 
    },

    password: { 
        type: String, 
        required: true 
    },
    isActive: {
    type: Boolean,
    default: true
}

}, { timestamps: true }); 

const Manager = mongoose.model("Manager", managerSchema); 

module.exports = Manager; 