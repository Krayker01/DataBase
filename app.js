const express = require("express");
const app = express();
const port = 3000;

const ejs = require("ejs");
app.set('view engine', "ejs");
app.use(express.static(__dirname + "/public"));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/registerDB');
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
    const newUser = new User({
      email: req.body.userName,
      password: req.body.password
    });

    try {
      await newUser.save();
      res.redirect("/");
    } catch (err) {
      console.log(err);
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
