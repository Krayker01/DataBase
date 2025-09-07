const express = require("express");
const app = express();
const port = 3000;

// export isAuthenticated and authorize modules
const { isAuthenticated, authorize } = require("./middleware/auth");

// Adding a hidden folder for API
require("dotenv").config();

const MongoStore = require("connect-mongo");

const session = require("express-session");
app.use(session({
  secret: process.env.SESSIONSECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: process.env.DATABASEKEY,
    collectionName: "sessions"
  }),
  cookie: {
    maxAge: 300000, //5min
    path: "/",
    domain: ".myapp.local",
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  }
}));

const ejs = require("ejs");
app.set('view engine', "ejs");
app.use(express.static(__dirname + "/public"));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Adding a function for password hashing
const bcrypt = require('bcrypt');
const saltRounds = 10;

const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(process.env.DATABASEKEY);
};
const Schema = mongoose.Schema;

// Create a userSchema and model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Required"]
  },
  email: {
    type: String,
    required: [true, "Required"]
  },
  password: {
    type: String,
    required: [true, "Required"]
  },
  role: {
    type: String,
    default: "user"
  }
});
const User = mongoose.model("User", userSchema);

// Create a publicationSchema and model
const publicationSchema = new mongoose.Schema({
  author: {
    type: Schema.Types.ObjectId, ref: "User"
  },
  title: {
    type: String,
    required: [true, "Required"]
  },
  publication: {
    type: String,
    required: [true, "Required"]
  },
  createdAt: {
    type: Date, default: Date.now
  }
});

const Publication = mongoose.model("Publication", publicationSchema);

app.listen(port, function () {
  console.log("Server started on port " + port);
});

app.route("/")
  .get(function (req, res) {
    res.render("index");
  })
  .post(async function (req, res) {
    try {
      const hash = await bcrypt.hash(req.body.password, saltRounds);

      const newUser = new User({
        name: req.body.firstUserName,
        email: req.body.userName,
        password: hash
      });

      await newUser.save();
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error saving user");
    }
  });

app.route("/login")
  .post(async function (req, res) {
    try {
      const foundUser = await User.findOne({ email: req.body.userName });

      if (!foundUser) {
        console.log("User not found");
        res.redirect("login");
      } else {
        const compare = await bcrypt.compare(req.body.password, foundUser.password);
        if (compare === true) {

          req.session.userId = foundUser._id;
          req.session.userName = foundUser.name;
          req.session.userRole = foundUser.role;
          req.session.save(err => {
            if (err) console.error(err);
            res.redirect("/homepage");
          });


        } else {
          console.log("Wrong login or password");
          res.redirect("/login");
        }
      }
    } catch (err) {
      res.status(500).send("Server error");
    }
  })
  .get(function (req, res) {
    res.render("login");
  });


app.route("/register")
  .post(function (req, res) {
    res.render("register");
  })
  .get(function (req, res) {
    res.render("register");
  });

app.route("/homepage")
  .get(isAuthenticated, async function (req, res) {
    const userPublications = await Publication.find({ author: req.session.userId }).sort({ createdAt: -1 });
    res.render("homepage", { userNameForHello: req.session.userName, userPublications: userPublications });
  })
  .post(function (req, res) {
    const newPublication = new Publication({
      author: req.session.userId,
      title: req.body.title,
      publication: req.body.publication
    });
    newPublication.save();
    res.redirect("/homepage");
  })