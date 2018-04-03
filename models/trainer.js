var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var trainerSchema = mongoose.Schema({
    name : String,
    experience : String,
    mobile : Number,
    prop : String,
    age : Number,
    image : String,
    users : [mongoose.Schema.Types.ObjectId],
    username: String,
    password: String
});

trainerSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Trainer", trainerSchema);
