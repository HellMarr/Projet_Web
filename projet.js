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

var Tableau_favoris = new Array(10).fill(0);
for (var i = 0; i < 100; i++)
{
 Tableau_favoris[i] = new Array(100).fill(0);
}

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
        lien_page : new Array(),      //contient le ou les liens 
        commentaires : new Array(),   //contient les coms s'il y en a 
        upvotes_link : new Array(),   //vérif pour flèche
        downvotes_link : new Array(), //vérif pour flèche 
        upvotes_com : new Array(),    //vérif pour flèche 
        downvotes_com : new Array(),  //vérif pour flèche
        lien_interagi : new Array(),      //contient le ou les liens avec lesquels l'utilisateur a interagi
        lien_interagi_com : new Array(),      //contient le ou les liens que l'utilisateur a commenté
        lien_interagi_vote : new Array(),      //contient le ou les liens que l'utilisateur a voté
        lien_favori : new Array(),          //contient le ou liens que l'utilisateur à placé en favori
        commentaires_inter : new Array(),   //contient les coms s'il y en a 
        upvotes_link_inter : new Array(),   //vérif pour flèche
        downvotes_link_inter : new Array(), //vérif pour flèche 
        upvotes_com_inter : new Array(),    //vérif pour flèche 
        downvotes_com_inter : new Array(),  //vérif pour flèche
        comment_id : req.query.comment_id,
        lien_24heures : new Array(),
        lien_all_time : new Array(),
        last_session : new Array(),
        current_session : new Array(),
        nouveaux_votes : new Array(),
        nouveaux_coms : new Array(),
    }

    //On créé un tableau avec les liens favoris
    if(data.session != undefined){
      for(let i=1; i<99; i++){
        if(Tableau_favoris[data.session][i] == 1){
          const db = await openDb()
          db.run(`
          UPDATE links
          SET favoris = 1
          WHERE link_id = ?
            `,[i])
        }
        else {
          db.run(`
          UPDATE links
          SET favoris = 0
          WHERE link_id = ?
            `,[i])
        }
      }
    }
    //Page d'acceuil
    data.lien_favori = await db.all(`
        SELECT * FROM links  
        LEFT JOIN logs ON links.log_link = logs.log_id
        WHERE favoris = 1
      `,)

    data.lien_24heures = await db.all(`
      SELECT * FROM links
      LEFT JOIN logs ON links.log_link = logs.log_id
      WHERE link_date > ?  
      ORDER BY nb_upvote_link + nb_commentaire_link DESC LIMIT 10
    `,[Date.now()-24*3600*1000])

    data.lien_all_time = await db.all(`
      SELECT * FROM links
      LEFT JOIN logs ON links.log_link = logs.log_id
      ORDER BY nb_upvote_link + nb_commentaire_link DESC LIMIT 10
    `)

    //Récupération de la date de dernière connexion de l'utilisateur
    data.last_session = await db.get(`
      SELECT last_session FROM logs
      WHERE log_id = ?
    `,[data.session])

    //Récupération de la date de connexion de l'utilisateur
    data.current_session = await db.get(`
      SELECT current_session FROM logs
      WHERE log_id = ?
    `,[data.session])

    //On prend tous les liens où il y a eu de nouveaux votes et où il avait intéragi
    data.nouveaux_votes = await db.all(`
      SELECT * FROM votes,links,coms
      WHERE link_date > ? OR vote_date > ?
    `,[1,1])
    //console.log(data.nouveaux_votes)

    //On prend tous les liens où il y a eu de nouveaux commentaires et où il avait intéragi
    data.nouveaux_coms = await db.all(`
      SELECT * FROM coms,links
      WHERE link_date > ? OR com_date > ?
    `,[1,1])
    //console.log(data.nouveaux_coms)


    //Page d'un lien
    if (data.sujet == "link"){    //récup lien
      data.lien_page = await db.all(`
        SELECT * FROM links
        LEFT JOIN logs ON links.log_link = logs.log_id
        WHERE link_id = ?
      `,[data.link_id])

      //recup coms lien
      data.commentaires = await db.all(`
        SELECT * FROM coms
        LEFT JOIN logs ON coms.log_com = logs.log_id
        WHERE link_com = ?
      `,[data.lien_page[0].link_id])
      
      data.commentaires = data.commentaires.reverse() //ORDER BY ne marchant pas on fait l'antichronologie ainsi
      

      //recup pour la verif des votes lien (utile pour flèches)
      data.upvotes_link[0] = await db.all(`    
        SELECT * FROM votes  
        WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
      `,[data.session, data.link_id,1])

      data.downvotes_link[0] = await db.all(`    
        SELECT * FROM votes  
        WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
      `,[data.session, data.link_id,-1])

      //recup pour la verif des votes coms (utile pour flèches)
      for(let j=0; j<data.commentaires.length; j++){
        data.upvotes_com[j] = await db.all(`    
          SELECT * FROM votes  
          WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
        `,[data.session, data.commentaires[j].com_id,1])

        data.downvotes_com[j] = await db.all(`    
          SELECT * FROM votes  
          WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
        `,[data.session, data.commentaires[j].com_id,-1])
      }

      if(data.commentaires.length==0)
          data.lien_page[0].nb_com_link=0   //Utile dans le cas où il n'y a aucun commentaire sur le lien

      //Gestion des boutons de likes
      //Liens
      if(data.upvotes_link[0].length==0)
          data.lien_page[0].nb_up_link=0 
      if(data.downvotes_link[0].length==0)
          data.lien_page[0].nb_down_link=0 

      //Commentaires
      for(let k=0; k<data.commentaires.length; k++){
        if(data.upvotes_com[k].length==0)
          data.commentaires[k].nb_up_com=0 
        if(data.downvotes_com[k].length==0)
          data.commentaires[k].nb_down_com=0 
      }
    }

    
    //Page de profil
    //Mes liens partagés
    if (data.sujet == "mes_liens"){     //recup liens
      data.lien_page = await db.all(`
        SELECT * FROM links
        LEFT JOIN logs ON links.log_link = logs.log_id    
        WHERE log_link = ? 
      `,[data.session])

      data.lien_page = data.lien_page.reverse() //ORDER BY ne marchant pas on fait l'antichronologie ainsi

      //recup coms des liens
      for(let i=0; i<data.lien_page.length; i++){
        data.commentaires[i] = await db.all(`
          SELECT * FROM coms
          LEFT JOIN logs ON coms.log_com = logs.log_id
          WHERE link_com = ?
        `,[data.lien_page[i].link_id])

        data.commentaires[i] = data.commentaires[i].reverse() //ORDER BY ne marchant pas on fait l'antichronologie ainsi

        //recup pour la verif des votes liens (utile pour flèches)
        data.upvotes_link[i] = await db.all(`    
          SELECT * FROM votes  
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session, data.lien_page[i].link_id,1])

        data.downvotes_link[i] = await db.all(`    
          SELECT * FROM votes  
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session, data.lien_page[i].link_id,-1])

        //recup pour la verif des votes coms (utile pour flèches)
        data.upvotes_com[i] = new Array()
        data.downvotes_com[i] = new Array()
        for(let j=0;j<data.commentaires[i].length;j++){
          data.upvotes_com[i][j] = await db.all(`    
            SELECT * FROM votes  
            WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
          `,[data.session, data.commentaires[i][j].com_id,1])

          data.downvotes_com[i][j] = await db.all(`    
            SELECT * FROM votes  
            WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
          `,[data.session, data.commentaires[i][j].com_id,-1])
        }

        if(data.commentaires[i].length==0)
          data.lien_page[i].nb_com_link=0   //Utile dans le cas où il n'y a aucun commentaire sur le lien

        //Gestion des boutons de likes
        //Commentaires
        if(data.upvotes_link[i].length==0)
          data.lien_page[i].nb_up_link=0 
        if(data.downvotes_link[i].length==0)
          data.lien_page[i].nb_down_link=0 
        
        //Commentaires
        for(let k=0; k<data.commentaires[i].length; k++){
          if(data.upvotes_com[i][k].length==0)
            data.commentaires[i][k].nb_up_com=0 
          if(data.downvotes_com[i][k].length==0)
            data.commentaires[i][k].nb_down_com=0 
        }
      }

      //Liens avec lesquels j'ai interagi
      data.lien_interagi_vote = await db.all(`
        SELECT * FROM votes  
        LEFT JOIN links ON votes.link_vote = links.link_id
        WHERE log_vote = ? AND link_vote > 0
      `,[data.session])

      data.lien_interagi_com = await db.all(`
        SELECT * FROM coms   
        LEFT JOIN links ON coms.link_com = links.link_id
        WHERE log_com = ?
      `,[data.session])

      data.lien_interagi = data.lien_interagi_com.concat(data.lien_interagi_vote)

      for(let l=0; l<data.lien_page.length; l++){   //On évite de mettre ses liens qu'il a aimé ou commenté
        data.lien_interagi = data.lien_interagi.filter(item => item.link_id != data.lien_page[l].link_id)
      }

      //On évite les doublons
      for(let l=0; l<data.lien_interagi.length; l++){   
        for (let x=0; x<data.lien_interagi.length; x++) {
            if((data.lien_interagi[l].link_id == data.lien_interagi[x].link_id) && (l !=x))
              data.lien_interagi[l].link_id = 0
        }
      }

      for(let l=0; l<data.lien_interagi.length; l++){   
        data.lien_interagi = data.lien_interagi.filter(item => item.link_id != 0)
      }

      //On récupère le pseudo des gens qui ont posté les liens
      const owners_link = new Array()
      for (let p=0; p<data.lien_interagi.length; p++) {
        owners_link[p] = await db.all(`
          SELECT link_id, log_name FROM links
          LEFT JOIN logs ON links.log_link = logs.log_id
          WHERE link_id = ?
        `,[data.lien_interagi[p].link_id])
        
        data.lien_interagi[p].owner_link = owners_link[p][0].log_name
      }
      

      //recup coms des liens
      for(let i=0; i<data.lien_interagi.length; i++){
        data.commentaires_inter[i] = await db.all(`
          SELECT * FROM coms
          LEFT JOIN logs ON coms.log_com = logs.log_id
          WHERE link_com = ?
        `,[data.lien_interagi[i].link_id])

        data.commentaires_inter[i] = data.commentaires_inter[i].reverse() //ORDER BY ne marchant pas on fait l'antichronologie ainsi

        //recup pour la verif des votes liens (utile pour flèches)
        data.upvotes_link_inter[i] = await db.all(`    
          SELECT * FROM votes  
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session, data.lien_interagi[i].link_id,1])

        data.downvotes_link_inter[i] = await db.all(`    
          SELECT * FROM votes  
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session, data.lien_interagi[i].link_id,-1])

        //recup pour la verif des votes coms (utile pour flèches)
        data.upvotes_com_inter[i] = new Array()
        data.downvotes_com_inter[i] = new Array()
        for(let j=0;j<data.commentaires_inter[i].length;j++){
          data.upvotes_com_inter[i][j] = await db.all(`    
            SELECT * FROM votes  
            WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
          `,[data.session, data.commentaires_inter[i][j].com_id,1])

          data.downvotes_com_inter[i][j] = await db.all(`    
            SELECT * FROM votes  
            WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
          `,[data.session, data.commentaires_inter[i][j].com_id,-1])
        }

        if(data.commentaires_inter[i].length==0)
          data.lien_interagi[i].nb_com_link=0   //Utile dans le cas où il n'y a aucun commentaire sur le lien

        //Gestion des boutons de likes
        //Commentaires
        if(data.upvotes_link_inter[i].length==0)
          data.lien_interagi[i].nb_up_link=0 
        if(data.downvotes_link_inter[i].length==0)
          data.lien_interagi[i].nb_down_link=0 
        
        //Commentaires
        for(let k=0; k<data.commentaires_inter[i].length; k++){
          if(data.upvotes_com_inter[i][k].length==0)
            data.commentaires_inter[i][k].nb_up_com=0 
          if(data.downvotes_com_inter[i][k].length==0)
            data.commentaires_inter[i][k].nb_down_com=0 
        }
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
    req.session.name = null
    req.session.password = null
    compteur = 0
    const db = await openDb()
    db.run(`
      UPDATE logs
      SET last_session = ?
      WHERE log_id = ?
    `,[Date.now(),req.session.user_id])
    req.session.user_id = 0;
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
        
        db.run(`
        UPDATE logs
        SET current_session = ?
        WHERE log_id = ?
      `,[Date.now(),req.session.user_id])

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
    edit : req.query.edit
  }

  if (data.type_edition == 2){    //Suppression commentaire
    const db = await openDb()

    await db.run(`
      DELETE FROM votes
      WHERE com_vote = ? AND log_vote = ?
    `,[data.com_id,req.session.user_id])

    const nb_com = await db.get(`
      SELECT nb_commentaire_link FROM links
      WHERE link_id = ?
    `,[data.link_id])

    await db.run(`
      UPDATE links
      SET nb_commentaire_link = ?
      WHERE link_id = ?
    `,[nb_com.nb_commentaire_link-1,data.link_id])

    await db.run(`
      DELETE FROM coms
      WHERE com_id = ?
    `,[data.com_id])
  
    res.redirect("/?sujet=link&link_id="+data.link_id+"&edit="+data.edit)
  }

  if (data.type_edition == 1){    //Suppression lien
    const db = await openDb()

    await db.run(`
      DELETE FROM votes
      WHERE link_vote = ? 
    `,[data.link_id])

    const commentaire_id = await db.get(`
      SELECT com_id FROM coms
      WHERE link_com = ?
    `,[data.link_id])

    if (data.commentaire_id){
      for (let i=0; i<commentaire_id.length; i++){
        await db.run(`
          DELETE FROM votes
          WHERE com_vote = ? 
        `,[commentaire_id[i].com_id])
      }
    }

    await db.run(`
      DELETE FROM coms
      WHERE link_com = ?
    `,[data.link_id])

    await db.run(`
      DELETE FROM links
      WHERE link_id = ?
    `,[data.link_id])
    
    res.redirect("/?sujet=mes_liens")
  }
});


app.post("/edit",async(req,res)=> {
  const data = {
    link : req.query.link_id,
    description : req.body.description,
  }

  const db = await openDb()
  db.run(`
    UPDATE links
    SET content_link = ?
    WHERE link_id = ?
  `,[data.description,data.link])
  
  res.redirect("/?sujet=link&link_id="+data.link+"&edit=1")
});

app.get("/vote",async(req,res)=> {
  const data = {
    session : req.session.user_id,
    upvote : req.query.upvote,
    downvote : req.query.downvote,
    link_id : req.query.link_id,
    com_id : req.query.comment_id,
    sujet : req.query.sujet,
  }
  const db = await openDb()

  //Variables pour les votes sur liens:
  const verif_up_lien = await db.all(`    
    SELECT * FROM votes  
    WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
  `,[data.session, data.link_id,1])

  const nb_up_link = await db.get(`
    SELECT nb_upvote_link FROM links  
    WHERE link_id = ? 
  `,[data.link_id])

  const verif_down_lien = await db.all(`
    SELECT * FROM votes  
    WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
  `,[data.session, data.link_id,-1])

  const nb_down_link = await db.get(`
    SELECT nb_downvote_link FROM links  
    WHERE link_id = ? 
  `,[data.link_id])

  //Variables pour les votes sur commentaires:
  const verif_up_com = await db.all(`    
    SELECT * FROM votes  
    WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
  `,[data.session, data.com_id,1])

  const nb_up_com = await db.get(`
    SELECT nb_upvote_com FROM coms  
    WHERE com_id = ? 
  `,[data.com_id])

  const verif_down_com = await db.all(`
    SELECT * FROM votes  
    WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
  `,[data.session, data.com_id,-1])

  const nb_down_com = await db.get(`
    SELECT nb_downvote_com FROM coms  
    WHERE com_id = ? 
  `,[data.com_id])
  if(data.upvote){    //upvote
    if(!data.com_id && data.link_id){    //upvote sur un lien
      if(verif_up_lien.length==0 && verif_down_lien.length==0){   //pas upvoté ni downvoté
        //Ajout upvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[1,Date.now(),data.session,data.link_id,0])  
        await db.run(`
          UPDATE links
          SET nb_upvote_link = ?
          WHERE link_id = ?
        `,[nb_up_link.nb_upvote_link+1,data.link_id]) 
      }
      else if(verif_up_lien.length==0 && verif_down_lien.length!=0){   //pas upvoté mais downvoté
        //Suppression downvote
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session,data.link_id,-1])  
        await db.run(`
          UPDATE links
          SET nb_downvote_link = ?
          WHERE link_id = ?
        `,[nb_down_link.nb_downvote_link-1,data.link_id])
        //Ajout upvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[1,Date.now(),data.session,data.link_id,0])  
        await db.run(`
          UPDATE links
          SET nb_upvote_link = ?
          WHERE link_id = ?
        `,[nb_up_link.nb_upvote_link+1,data.link_id])   
      }
      else{                          //déjà upvoté
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session,data.link_id,1])  
        await db.run(`
          UPDATE links
          SET nb_upvote_link = ?
          WHERE link_id = ?
        `,[nb_up_link.nb_upvote_link-1,data.link_id]) 
      }
    }
    
    if(data.com_id && data.link_id){    //upvote sur un commentaire

      if(verif_up_com.length==0 && verif_down_com.length==0){   //pas upvoté ni downvoté
        //Ajout upvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[1,Date.now(),data.session,0,data.com_id])  
        await db.run(`
          UPDATE coms
          SET nb_upvote_com = ?
          WHERE com_id = ?
        `,[nb_up_com.nb_upvote_com+1,data.com_id]) 
      }
      else if(verif_up_com.length==0 && verif_down_com.length!=0){   //pas upvoté mais downvoté
        //Suppression downvote
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
        `,[data.session,data.com_id,-1])  
        await db.run(`
          UPDATE coms
          SET nb_downvote_com = ?
          WHERE com_id = ?
        `,[nb_down_com.nb_downvote_com-1,data.com_id])
        //Ajout upvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[1,Date.now(),data.session,0,data.com_id])  
        await db.run(`
          UPDATE coms
          SET nb_upvote_com = ?
          WHERE com_id = ?
        `,[nb_up_com.nb_upvote_com+1,data.com_id])   
      }
      else{                          //déjà upvoté
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
        `,[data.session,data.com_id,1])  
        await db.run(`
          UPDATE coms
          SET nb_upvote_com = ?
          WHERE com_id = ?
        `,[nb_up_com.nb_upvote_com-1,data.com_id]) 
      }
    }
  }

  if(data.downvote){    //downvote
    if(!data.com_id && data.link_id){    //downvote sur un lien

      if(verif_down_lien.length==0 && verif_up_lien.length==0){   //pas downvoté ni upvoté
        //Ajout downvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[-1,Date.now(),data.session,data.link_id,0])  
        await db.run(`
          UPDATE links
          SET nb_downvote_link = ?
          WHERE link_id = ?
        `,[nb_down_link.nb_downvote_link+1,data.link_id]) 
      }
      else if(verif_down_lien.length==0 && verif_up_lien.length!=0){   //pas downvoté mais upvoté
        //Suppression upvote
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session,data.link_id,1])  
        await db.run(`
          UPDATE links
          SET nb_upvote_link = ?
          WHERE link_id = ?
        `,[nb_up_link.nb_upvote_link-1,data.link_id])
        //Ajout downvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[-1,Date.now(),data.session,data.link_id,0])  
        await db.run(`
          UPDATE links
          SET nb_downvote_link = ?
          WHERE link_id = ?
        `,[nb_down_link.nb_downvote_link+1,data.link_id])   
      }
      else{                          //déjà downvoté
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND link_vote = ? AND type_vote = ?
        `,[data.session,data.link_id,-1])  
        await db.run(`
          UPDATE links
          SET nb_downvote_link = ?
          WHERE link_id = ?
        `,[nb_down_link.nb_downvote_link-1,data.link_id]) 
      }
    }
    
    if(data.com_id && data.link_id){    //downvote sur un commentaire

      if(verif_down_com.length==0 && verif_up_com.length==0){   //pas downvoté ni upvoté
        //Ajout downvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[-1,Date.now(),data.session,0,data.com_id])  
        await db.run(`
          UPDATE coms
          SET nb_downvote_com = ?
          WHERE com_id = ?
        `,[nb_down_com.nb_downvote_com+1,data.com_id]) 
      }
      else if(verif_down_com.length==0 && verif_up_com.length!=0){   //pas downvoté mais upvoté
        //Suppression upvote
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
        `,[data.session,data.com_id,1])  
        await db.run(`
          UPDATE coms
          SET nb_upvote_com = ?
          WHERE com_id = ?
        `,[nb_up_com.nb_upvote_com-1,data.com_id])
        //Ajout downvote
        await db.run(`
          INSERT INTO votes(type_vote, vote_date, log_vote, link_vote, com_vote) VALUES(?,?,?,?,?)
        `,[-1,Date.now(),data.session,0,data.com_id])  
        await db.run(`
          UPDATE coms
          SET nb_downvote_com = ?
          WHERE com_id = ?
        `,[nb_down_com.nb_downvote_com+1,data.com_id])   
      }
      else{                          //déjà downvoté
        await db.run(`
          DELETE FROM votes
          WHERE log_vote = ? AND com_vote = ? AND type_vote = ?
        `,[data.session,data.com_id,-1])  
        await db.run(`
          UPDATE coms
          SET nb_downvote_com = ?
          WHERE com_id = ?
        `,[nb_down_com.nb_downvote_com-1,data.com_id]) 
      }
    } 
  }

  if(data.sujet == "link")
    res.redirect("/?sujet="+data.sujet+"&link_id="+data.link_id)
  else
    res.redirect("/?sujet="+data.sujet)
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
        INSERT INTO links(name, content_link, log_link, nb_upvote_link, nb_downvote_link, link_date) VALUES(?,?,?,?,?,?)
    `,[data.lien,data.description,req.session.user_id,0,0,Date.now()])

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
    const db = await openDb()
    const nb_com = await db.get(`
      SELECT nb_commentaire_link FROM links
      WHERE link_id = ?
    `,[data.link_id])

    await db.run(`
      INSERT INTO coms(content_com, nb_upvote_com, nb_downvote_com, link_com, log_com, com_date) VALUES(?, ?, ?, ?, ?, ?)
    `,[data.commentaire,0,0,data.link_id,req.session.user_id,Date.now()])
    
    await db.run(`
      UPDATE links
      SET nb_commentaire_link = ?
      WHERE link_id = ?
    `,[nb_com.nb_commentaire_link+1,data.link_id])

    res.redirect("/?sujet="+data.sujet+"&link_id="+data.link_id+"&lien_envoi=5")
  }  
});

app.get("/add_favorite",async(req,res)=> {
  const data = {
    link_id : req.query.link_id,
  }
  Tableau_favoris[req.session.user_id][data.link_id] = 1
  res.redirect("/?sujet=link&link_id="+data.link_id+"&lien_envoi=6")
})

app.get("/remove_favorite",async(req,res)=> {
  const data = {
    link_id : req.query.link_id,
  }
  Tableau_favoris[req.session.user_id][data.link_id] = 0
  res.redirect("/?sujet=link&link_id="+data.link_id+"&lien_envoi=7")
})

app.listen(port,() => {
    console.log("Listening on port ", port)
  })