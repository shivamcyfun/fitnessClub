var mongoose = require("mongoose");
var user = require("./models/user");

function seedDBUser(){
    user.remove({},function(err){
    if(err){
        console.log(err);
    }
    console.log("removed users!");
});
}

module.exports = seedDBUser;
