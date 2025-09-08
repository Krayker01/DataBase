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
    // domain: ".myapp.local",
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
    required: [true, "Required"],
    maxlength: [40, "Name cannot exceed 40 characters"]
  },
  email: {
    type: String,
    required: [true, "Required"],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
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
  .get(async function (req, res) {
    const allPublications = await Publication.find()
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.render("index", { allPublications: allPublications });
  })
  .post(function (req, res) {
    res.render("index");
  });

app.route("/login")
  .post(async function (req, res) {
    try {
      const foundUser = await User.findOne({ email: req.body.userName.toLowerCase() });

      if (!foundUser) {
        console.log("User not found");
        return res.redirect("/login");
      }

      const compare = await bcrypt.compare(req.body.password, foundUser.password);
      if (compare === true) {

        req.session.userId = foundUser._id;
        req.session.userName = foundUser.name;
        req.session.userRole = foundUser.role;
        res.redirect("/homepage");

      } else {
        console.log("Wrong login or password");
        return res.redirect("/login");
      }
    } catch (err) {
      return res.status(500).send("Server error");
    }
  })
  .get(function (req, res) {
    res.render("login");
  });


app.route("/register")
  .get(function (req, res) {
    res.render("register");
  })
  .post(async function (req, res) {
    try {
      const existingUser = await User.findOne({ email: req.body.userName.toLowerCase() })
      if (existingUser) {
        return res.status(400).send("Email is alredy registered");
      }

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

app.route("/homepage")
  .get(isAuthenticated, async function (req, res) {
    const allPublications = await Publication.find()
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(20);
    const currentUserId = req.session.userId;
    const userPublications = await Publication.find({ author: currentUserId }).sort({ createdAt: -1 });
    res.render("homepage", { userNameForHello: req.session.userName, userPublications: userPublications, allPublications: allPublications, currentUserId: currentUserId });
  })
  .post(async function (req, res) {
    const newPublication = new Publication({
      author: req.session.userId,
      title: req.body.title,
      publication: req.body.publication
    });
    await newPublication.save();
    res.redirect("/homepage");
  });

app.post("/publication/delete/:id", isAuthenticated, async function (req, res) {
  try {
    const pubId = req.params.id; //id is taken from the dynamic URL
    const deletePublication = await Publication.findOne({ _id: pubId, author: req.session.userId });
    if (!deletePublication) {
      return res.status(400).send("Publication was not found");
    }
    await deletePublication.deleteOne({ _id: pubId });
    res.redirect("/homepage");
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});