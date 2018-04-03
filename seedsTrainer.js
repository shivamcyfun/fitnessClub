var mongoose = require("mongoose");
var trainer = require("./models/trainer");

function seedDBtrainer(){
    trainer.remove({},function(err){
    if(err){
        console.log(err);
    }
    console.log("removed trainers!");
});
}

module.exports = seedDBtrainer;
