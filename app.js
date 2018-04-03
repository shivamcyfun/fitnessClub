var bodyParser           =      require("body-parser"),
    express              =      require("express"),
    mongoose             =      require("mongoose"),
    passport             =      require("passport"),
    LocalStrategy        =      require("passport-local").Strategy,
    User                 =      require("./models/user"),
    Trainer              =      require("./models/trainer"),
    seedDBtrainer        =      require("./seedsTrainer"),
    seedDBuser           =      require("./seedsUser"),
    multer               =      require("multer"),
    flash                =      require("connect-flash"),
    cookieParser         =      require('cookie-parser'),
    cloudinary           =      require("cloudinary");
    path                 =      require("path");
    app = express();


    // seedDBtrainer();
    // seedDBuser();

var dburl = process.env.DATABASEURL || "mongodb://localhost/fitnessClub" ;
mongoose.connect(dburl);
app.set("view engine", "ejs");
app.use(express.static("./public"));
app.use(bodyParser.urlencoded({extended : true}));

// setting up cloudinar
// cloudinary.config({
//   cloud_name: *****,
//   api_key: *****,
//   api_secret: *****
// });

// PASSPORT CONFIGURATION
app.use(cookieParser('secret'));
app.use(require("express-session")({
    cookie: { maxAge: 600000 },
    secret : "lets do it",
    resave : false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use("user",new LocalStrategy(User.authenticate()));
passport.use("trainer",new LocalStrategy(Trainer.authenticate()));
passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    if(!user){
      Trainer.findById(id,function(err,trainer){
        done(err,trainer);
      })
    }else{
      done(err,user);
    }
  })
});

const storage = multer.diskStorage({
      destination: function (req, file, callback) {
                   callback(null, "./public/uploads/");
                    },
      filename: function (req, file, callback) {
                   callback(null, file.fieldname + '-' + Date.now() + ".jpg");
                   }
             });
const upload = multer({storage:storage}).single("myimage");

app.use(flash());

app.use(function(req,res,next){
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});


//----------------------------routes-----------------------------------
app.get("/",function(req,res){
   res.redirect("/fitnessClub");
});

app.get("/fitnessClub",function(req,res){
   Trainer.find({},function(err,allTrainers){
       if(err){
           console.log(err);
       }else{
           res.render("index", {trainers : allTrainers , currentUser: req.user});
       }
   });
});

app.get("/trainer:id",function(req, res) {
   let temp = [] ,i = 0;
   if(req.user.users.length===0) {
     res.render("trainer",{currentUser:req.user,users:temp});
   }else{
   req.user.users.forEach(function(tempUser){
     User.findById(tempUser,function(err,userToAdd){
       i++;
       if(err) console.log(err);
       else {
         temp.push(userToAdd);
       }
       if(i==req.user.users.length){
         res.render("trainer",{currentUser:req.user,users:temp});
       }
     });
   });}
});

app.get("/user:id",isLoggedIn,function(req, res) {

   Trainer.findById(req.user.trainer,function(err,trainer){
     if(err) console.log(err);
     else res.render("user",{currentUser:req.user , currentTrainer : trainer});
   })
});

app.get("/setRoutine:id", isLoggedIn,function (req,res) {
  let str = req.url;
  let id = str.substring(12);
  User.findById(id,function (err,temp) {
    if(err) console.log(err);
    else{
    console.log(temp);
    res.render("setRoutine",{currentUser:req.user,trainee : temp});
  }
  });
});

app.post("/setRoutine:id",isLoggedIn,function(req,res){
  let str = req.url;
  let temparray = [req.body.Monday,req.body.Tuesday,req.body.Wednesday,req.body.Thursday,req.body.Friday,req.body.Saturday,req.body.Sunday];
  let id = str.substring(12);
  User.findByIdAndUpdate(id,{exercises:temparray,progressFitness:req.body.progressFitness,
      progressStrength: req.body.progressStrength, progressFlexibility: req.body.progressFlexibility
  },function (err,temp) {
    if(err) console.log(err);
    else{
     let aa = "/trainer:" + req.user._id;
     res.redirect(aa);
    }
  });
});

// AUTH ROUTES

app.get("/register",function(req, res) {

    Trainer.find({},function(err,allTrainers){
       if(err){
           console.log(err);
       }else{
           res.render("register", {trainers : allTrainers , currentUser: req.user });
       }
   });

});

app.get("/register/trainer",isAdmin,function (req,res) {
  res.render("registerTrainer",{currentUser:req.user});
});

app.post("/register/trainer",isAdmin,function(req,res){
  upload(req,res,function(err){
    if(err){
      console.log(err);
    }
    let uploadUrl = "public/uploads/" + req.file.filename;
    // cloudinary.v2.uploader.upload(uploadUrl,function(err, result){
    //   if(err) console.log(err);
    //   else {
        var newTrainer = new Trainer({username:req.body.username});
        newTrainer.prop = "trainer";
        newTrainer.name = req.body.name;
        newTrainer.age = req.body.age;
        newTrainer.mobile = req.body.mobile;
        newTrainer.experience = req.body.experience;
        // newTrainer.image = result.url;
        newTrainer.image = "uploads/" + req.fil.filename;

        Trainer.register(newTrainer,req.body.password,function (err,trainer) {
          if(err){
            console.log(err);
            res.flash("error","Username not available");
            return res.redirect("/register");
          }

          passport.authenticate("trainer")(req,res,function () {
            res.redirect("/trainer:"+req.user._id);
          });
        });
    //   }
    // });
  });
});

app.post('/register/user', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
    }

    // let uploadUrl = "public/uploads/" + req.file.filename;
    // cloudinary.v2.uploader.upload(uploadUrl,function(err, result){
    //   if(err) console.log(err);
    //   else {
        var newUser = new User({username:req.body.username});
        newUser.prop = "user";
        newUser.name = req.body.name;
        newUser.age = req.body.age;
        newUser.mobile = req.body.mobile;
        newUser.isAdmin = false;
        // newUser.image = result.url;
        newUser.image = "uploads/" + req.file.filename;
        let days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
        newUser.days = days;
        let exercises = [[],[],[],[],[],[],[]];
        newUser.exercises = exercises;
        newUser.progressStrength = 0;
        newUser.progressFitness = 0;
        newUser.progressFlexibility = 0;

        Trainer.find({name:req.body.trainer},function(err,trainer){
          if(err){
            console.log(err);
          }else{
            newUser.trainer = trainer[0]._id;
            let temp = trainer[0].users;
            temp.push(newUser._id);
            trainer[0].users = temp;
            trainer[0].save();
          }
        });

        User.register(newUser,req.body.password, function(err,user){
          if(err){
              // console.log(err);
              req.flash("error","Username not available");
              return res.redirect("/register");
          }


          passport.authenticate("user")(req,res,function(){
              res.redirect("/user:"+req.user._id);
          });

        });
    //   }
    // });
  });
});

app.post("/query" , function(req,res){
  req.flash("success","Your response has been noted.");
  res.redirect("/fitnessClub");
});

// LOGIN ROUTES

app.get("/login",function(req, res) {
    res.render("login",{currentUser: req.user});
});

app.post('/login/trainer', function(req, res, next) {
  passport.authenticate('trainer', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      req.flash("error","Invalid username or password")
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/trainer:' + req.user._id);
    });
  })(req, res, next);
});

app.post('/login/user', function(req, res, next) {
  passport.authenticate('user', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      req.flash("error","Invalid username or password")
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/user:' + req.user._id);
    });
  })(req, res, next);
});


// LOGOUT
app.get("/logout",function(req, res) {
    req.logout();
    req.flash("success","You have been logged out!");
    res.redirect("/fitnessClub");
});

// LOGIC ROUTES
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You must be logged in!");
    res.redirect("/login");
}

function isAdmin(req,res,next) {
  if(!req.isAuthenticated()){
    req.flash("error","You must be logged in!");
    res.redirect("/login");
  }else{
    var user = req.user;
    if(user.isAdmin) next();
    else{
      req.flash("error", "You are not an admin!");
      res.redirect("/fitnessClub");
    }
  }
}
//------------------routes---------------------------------

app.listen(process.env.PORT || 80 ,function(){
    console.log("server has started");
});
