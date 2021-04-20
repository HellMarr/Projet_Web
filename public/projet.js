//Code js

const express = require('express');
const useradmin = {
    email :"martin.heliot@free.fr",
    name :"Martin",
    password :"Martin"
}
const app = express()
const port = 4000

const bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const session = require('express-session')
//const SQLiteStore = require('connect-sqlite3')(session);

const config = {
    //store: new SQLiteStore,
    secret: 'secret key',
    resave: true,
    rolling: true,
    cookie: {
      maxAge: 1000 * 3600//ms
    },
    saveUninitialized: true
  }

  if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
  }
  app.use(session(config))

app.set('views', './Views');
app.set('view engine', 'jade');

var compteur = 0 ;
//const {openDb} = require("./db");

app.get("/",async(req,res)=> {
    const data = {
        name : req.session.name,
        password : req.session.password,
        session : req.session.user_id,
        compteur : compteur
    }
    res.render("projet",data)
});

app.post("/login",async(req,res)=> {
    const data = {
      name : req.body.name,
      password : req.body.password,
      session : req.session.user_id,
      compteur : compteur
      
    }
    console.log(data.name)
    if ((data.name == useradmin.name || data.name == useradmin.email) && data.password == useradmin.password ){ 
      req.session.user_id = 1
      req.session.name = "Martin"
      req.session.password = "Martin"
      res.redirect("/")
    }
    else {
      compteur = compteur + 1 ;
      res.redirect("/")
    }
});

app.post("/disconnect",async(req,res)=> {
    req.session.user_id = 0;
    req.session.name = null
    req.session.password = null
    compteur = 0
    res.redirect("/")
});

app.get("/register",async(req,res)=> {
  const data = {
    inscription : req.query.register,
    name_register : req.body.name_register,
    password_register : req.body.password_register,
    email_register : req.body.email_register,
  }
  console.log(data.email_register)
  if (data.inscription == 1) {
    res.render("projet",data)
  }
  if (data.inscription == 2) {
    console.log("Ajout dans la base de données si tout est bon ");
    compteur = 0
    res.redirect("/")
  }
  if (data.inscription == 0) {
    compteur = 0
    res.redirect("/")
  }
  
});

app.listen(port,() => {
    console.log("Listening on port ", port)
  })