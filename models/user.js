var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var userSchema = mongoose.Schema({
    fb_id : Number,
    isAdmin : Boolean,
    name : String,
    days : [String],
    exercises : [[String]],
    progressFitness : Number,
    progressStrength : Number,
    progressFlexibility : Number,
    age: Number,
    prop : String,
    mobile : Number,
    image : String,
    trainer :  mongoose.Schema.Types.ObjectId,
    username: String,
    password: String
});



userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
