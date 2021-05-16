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
    const db = await openDb()

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
        lien_page : new Array(),
        commentaires : new Array(),
        upvote : req.query.upvote,
        downvote : req.query.downvote,
        comment_id : req.query.comment_id,
    }

    if (data.link_id){
      data.lien_page = await db.all(`
        SELECT * FROM links
        WHERE link_id = ?
      `,[data.link_id])

      data.commentaires[0] = await db.all(`
        SELECT content_com, com_id, nb_upvote_com, nb_downvote_com, log_name FROM coms
        LEFT JOIN logs ON coms.log_com = logs.log_id
        WHERE link_com = ?
      `,[data.lien_page[0].link_id])

      if(data.commentaires[0].length==0)
          data.lien_page[0].nb_com_link=0   //Utile dans le cas où il n'y a aucun commentaire sur le lien
    }
    
    if (data.sujet == "mes_liens"){   //Liens partagés par l'utilisateur
      data.lien_page = await db.all(`
        SELECT * FROM links
        WHERE log_link = ?
      `,[data.session])


      for(let i=0; i<data.lien_page.length; i++){
        data.commentaires[i] = new Array()
        data.commentaires[i] = await db.all(`
          SELECT content_com, com_id, link_com, nb_upvote_com, nb_downvote_com, log_name FROM coms
          LEFT JOIN logs ON coms.log_com = logs.log_id
          WHERE link_com = ?
        `,[data.lien_page[i].link_id])

        if(data.commentaires[i].length==0)
          data.lien_page[i].nb_com_link=0   //Utile dans le cas où il n'y a aucun commentaire sur le lien
      }
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
    com_id : req.query.comment_id,
    type_edition : req.query.type_edition,
    link_id : req.query.link_id,
  }
  if (data.type_edition == 2){
    console.log("On enlève le commentaire numéro com_id de la Database")
    res.redirect("/?sujet=link&link_id="+data.link_id+"&edit=1")
  }
  if (data.type_edition == 1){
    console.log("On Supprime carrément le lien")
    res.redirect("/")
  }

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
    lien : req.body.lien,
    description: req.body.description
  }
  if (data.lien.match(/http(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/)){
    if (data.description.length==0) {   //Pas de description du lien
      res.redirect("/?lien_envoi=3")
    }

    else{
      // Ajout du lien à la database des liens partagés
      const db = await openDb()
      await db.run(`
        INSERT INTO links(name, content_link, log_link, nb_upvote_link, nb_downvote_link) VALUES(?,?,?,?,?)
    `,[data.lien,data.description,req.session.user_id,0,0])

      res.redirect("/?lien_envoi=1")
    }  
  }  
  else 
    res.redirect("/?lien_envoi=2")
});

app.post("/add_comment",async(req,res)=> {
  const data = {
    commentaire : req.body.commentaire,
    link_id : req.body.link_id,
    sujet : req.body.sujet,
  }

  if (data.commentaire.length==0) {   //Le commentaire est vide
    res.redirect("/?sujet="+data.sujet+"&link_id="+data.link_id+"&lien_envoi=4")
  }

  else{
    console.log("Ajout du commentaire à la database des commentaires de ce lien en question")
    const db = await openDb()
    await db.run(`
    INSERT INTO coms(content_com, nb_upvote_com, nb_downvote_com, link_com, log_com) VALUES(?, ?, ?, ?, ?)
  `,[data.commentaire,0,0,data.link_id,req.session.user_id])

    res.redirect("/?sujet="+data.sujet+"&link_id="+data.link_id+"&lien_envoi=5")
  }  
});

app.listen(port,() => {
    console.log("Listening on port ", port)
  })