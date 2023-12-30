//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { Client } = require('pg');

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set('view engine', 'ejs');

const db = new Client({
    user: "postgres",
    host: "localhost",
    database: "secrets",
    password: "1qay2wsxM,pn",
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({extended:true}));

app.get("/", function (req, res){
    res.render("home");
});

app.get("/login", function (req, res){
    res.render("login");
});

app.get("/register", function (req, res){
    res.render("register");
});

app.post("/register", async function (req,res) {
    const encryptedPassword = await db.query('SELECT crypt($1, gen_salt(\'bf\')) AS encrypted_password', [req.body.password]);
    await db.query('INSERT INTO users(email, password) VALUES($1, $2) RETURNING *', [req.body.username, encryptedPassword.rows[0].encrypted_password], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
});

app.post("/login", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  await db.query('SELECT * FROM users WHERE email = $1', [username], async (err, result) => {
    if (err) {
      console.log(err);
    } else {
      const foundUser = result.rows[0];
      const isPasswordValid = await db.query('SELECT $1 = crypt($2, $1) AS is_valid', [foundUser.password, password]);
      if (isPasswordValid.rows[0].is_valid) {
        res.render("secrets");
      }
    }
  });
});

app.listen(3000, function() {
    console.log(`Server started on port ${port}.`)
});