//Code js

const express = require('express');
const app = express()
const port = 4000

const bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const session = require('express-session');
//const { strict } = require('node:assert');
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
const {openDb} = require("./db");

app.get("/",async(req,res)=> {
    const data = {
        name : req.session.name,
        password : req.session.password,
        session : req.session.user_id,
        compteur : compteur,
        sujet : req.query.sujet,
        lien : req.query.lien,
        lien_envoi : req.query.lien_envoi,
        link_id : req.query.link_id,
        edit : req.query.edit,
        lien_page : [
        {id: '1', description: 'Ceci est google', link:"google.fr", commentaires : [{user: "Roger", texte:"Doctissimo m'a dit que j'ai un cancer",id: '1'},{user: "Denis", texte:"BOOMER",id: '2'}]},
        {id: '2', description: 'Ceci n est pas google', link:"gogole.fr", commentaires : [{user: "Daniel", texte:"PSG>>City",id: '1'},{user: "Aziz", texte:"mais quid du reste ?",id: '2'}]},
        {id: '3', description: 'Ceci non plus', link:"gloglo.fr" ,commentaires : [{user: "François", texte:"Abonnez vous je rend",id: '1'},{user: "Gregoire", texte:"qqn dispo en traitement numérique du signal ?",id: '2'}]}
        ],
    }
    if (data.link_id){
      console.log("Ici tu changes le tableau lien_page pour qu'il n'ai qu'une seule ligne, correspondant aux critères du lien partagé numéro link_id")
    }
    if (data.sujet == "mes_liens"){
      console.log("On parcours la database, et on ajoute les liens dans le tableau nombre_lien_page avec nombre_lien_page.push")
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
    
    const db = await openDb()
    const obj_pwd = await db.all(`
      SELECT pwd, log_id FROM logs
      WHERE log_name = ? OR mail = ?
    `,[data.name, data.name])

    if (obj_pwd.length===0) {
      compteur += 1
      res.redirect("/")
    }

    for (let i=0; i < obj_pwd.length; i++) {  //Boucle for pour anticiper un problème de même pseudo pour des utilisateurs différents
      if (data.password !== obj_pwd[i].pwd) {
        compteur += 1
        res.redirect("/")
    }
      else if (data.password === obj_pwd[i].pwd) {
        req.session.user_id = obj_pwd[i].log_id
        req.session.name = data.name
        req.session.password = data.password
        res.redirect("/")
    }
    }
});

app.post("/disconnect",async(req,res)=> {
    req.session.user_id = 0;
    req.session.name = null
    req.session.password = null
    compteur = 0
    res.redirect("/")
});

app.post("/register",async(req,res)=> {
  const data = {
    inscription : req.query.register,
    etat : req.query.state,
    name_register : req.body.name_register,
    password_register : req.body.password_register,
    email_register : req.body.email_register,
    password_register_confirm : req.body.password_register_confirm,  
  }
  //On se connecte automatiquement avec nos identifiants
  if (data.name_register.length > 3 && data.password_register.length > 5 && data.email_register.match(/[a-z0-9_\-\.]+@[a-z0-9_\-\.]+\.[a-z]+/i) && data.password_register == data.password_register_confirm){
      compteur = 0

      //Ajout à la database

      const db = await openDb()
      const mails = await db.all(`
        SELECT mail FROM logs
      `)

      var valide_mail = 0
      for (let i = 0; i < mails.length; i++) {
        if (data.email_register !== mails[i].mail) {    //Sert à vérifier que le mail n'est pas déjà utilisé
           valide_mail += 1
        }
      }

      if (valide_mail === mails.length) {               //Choix de mail valide 
        await db.run(`
          INSERT INTO logs(mail, log_name, pwd) VALUES(?,?,?)
        `,[data.email_register, data.name_register, data.password_register])

        req.session.user_id = mails.length+1    //numéro du dernier log_id qu'on vient d'ajouter

        res.redirect("/")
      }

      else{                                             //Tentative d'inscription avec un mail déjà utilisé
        res.redirect("/register?register=1&state=5")
      }
  }
  else if (data.name_register.length <= 3){
      res.redirect("/register?register=1&state=1")
  }
  else if (!data.email_register.match(/[a-z0-9_\-\.]+@[a-z0-9_\-\.]+\.[a-z]+/i)){
    res.redirect("/register?register=1&state=2")
  }
  else if (data.password_register.length <= 5){
    res.redirect("/register?register=1&state=3")
  }
  else if (data.password_register != data.password_register_confirm){
    res.redirect("/register?register=1&state=4")
  }
});

app.get("/register",async(req,res)=> {
  const data = {
    inscription : req.query.register,
    etat : req.query.state,
  }
  if (data.inscription == 1) {
    res.render("projet",data)
  }
  if (data.inscription == 0) {
    compteur = 0
    res.redirect("/")
  }
});

app.get("/edit",async(req,res)=> {
  const data = {
    com_id : req.query.com,
  }
  console.log("On enlève le commentaire numéro com_id de la Database")
  res.redirect("/?sujet=link&link_id=1&edit=1")
});

app.post("/edit",async(req,res)=> {
  const data = {
    lien : req.body.lien,
    description : req.body.description,
  }
  console.log("On valide nos changements dans la database")
  res.redirect("/?sujet=link&link_id=1&edit=1")
});

app.post("/add_link",async(req,res)=> {
  const data = {
    lien : req.body.lien
  }
  if (data.lien.match(/http(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/)){
    // Ajout du lien à la database des liens partagés
    const db = await openDb()
    await db.run(`
      INSERT INTO links(name, log, nb_upvote, nb_downvote) VALUES(?,?,?,?)
    `,[data.lien,req.session.user_id,0,0])

    res.redirect("/?lien_envoi=1")
  }  
  else 
    res.redirect("/?lien_envoi=2")
});

app.listen(port,() => {
    console.log("Listening on port ", port)
  })