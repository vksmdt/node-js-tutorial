import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// connect database
mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console.log(err);
  });

// create schema to connect a database
const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// create a model like collection in database
const User = mongoose.model("User", userSchema);

const port = 5000;
const hostName = "localhost";
const app = express();

// index statice file acces karne ke liye , express.static ek middleware he isko use karne ke liye app.use ka use karna hoga
// USING MIDDLEWARE //
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ejs ka engine set karna -- setting up view engin
app.set("view engine", "ejs");

// using cookies token auth as a middleware

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "vikasmoodotiya");

    // yha pahle hi user ki information ko save kar lenge req.user me
    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", {
    name: req.user.name,
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", async (req, res) => {
  res.render("login");
});

// login page
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });

  if (!user) {
    return res.redirect("/register");
  }
  // comapare bcrypt password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render("login", { email, message: "incorect password" });
  }
  const token = jwt.sign({ _id: user._id }, "vikasmoodotiya");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

// register page
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  // password conver to hash
  const hashPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashPassword,
  });

  const token = jwt.sign({ _id: user._id }, "vikasmoodotiya");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

// app.get("/success", (req, res) => {
//   // app .render se index.html ki access kar sakte hai
//   res.render("success");
//   // res.sendFile("index.html")
// });

// // app.post("/", async (req, res) => {
// //   const { name, email } = req.body;
// //   await Message.create({
// //     name,
// //     email,
// //   });
// //   res.redirect("/success");
// // });

// app.get("/users", (req, res) => {
//   res.json({
//     user,
//   });
// });

// app.get("/add", async (req, res) => {
//   await Message.create({
//     name: "vikas Moodotiya",
//     email: "vksmdt@gmail.com",
//   });
//   res.send("nice");
// });

app.listen(port, hostName, () => {
  console.log(`server is working http://${hostName}:${port}`);
});
