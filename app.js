const express = require("express");
const app = express();
const port = 3000;

const ejs = require("ejs");
app.set('view engine', "ejs");
app.use(express.static(__dirname + "/public"));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

// Adding a hidden folder for API
require("dotenv").config();

// Adding a function for password hashing
const bcrypt = require('bcrypt');
const saltRounds = 10;

const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(process.env.DATABASEKEY);
};
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Required"]
  },
  password: {
    type: String,
    required: [true, "Required"]
  }
});
const User = mongoose.model("User", userSchema);

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
  .post(function (req, res) {
    res.render("login");
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
  .post(async function (req, res) {
    try {
      const foundUser = await User.findOne({ email: req.body.userName });

      if (!foundUser) {
        console.log("User not found");
        res.redirect("/");
      } else {
        const compare = await bcrypt.compare(req.body.password, foundUser.password);
        if (compare === true) {
          res.render("homepage");
        } else {
          console.log("Wrong login or password");
          res.redirect("/");
        }
      }
    } catch (err) {
      res.status(500).send("Server error");
    }
  });