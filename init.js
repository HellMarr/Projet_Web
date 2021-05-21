//Initialisation base de données avec ajout des données demandées de base.

const {openDb} = require("./db")

const tablesNames = ["logs","links","coms","votes"]

async function createLogs(db){
    const insertRequest = await db.prepare("INSERT INTO logs(mail,log_name,pwd) VALUES(?,?,?)")
    const contents = [{
        mail: "max@max.fr",
        log_name: "max",
        pwd: "max"
    },
      {
        mail: "bob@bob.fr",
        log_name: "bob",
        pwd: "bob"
      }
    ]
    return await Promise.all(contents.map(logs => {
      return insertRequest.run(logs.mail, logs.log_name, logs.pwd)
    }))
  }
  
  async function createLinks(db){
    const insertRequest = await db.prepare("INSERT INTO links(name, content_link, nb_upvote_link, nb_downvote_link, nb_commentaire_link, log_link) VALUES(?,?,?,?,?,?)")
    const contents = [{
      name: "http://google.fr",
      content_link: "Voici mon 1er lien",
      nb_upvote_link: 0,
      nb_downvote_link: 0,
      nb_commentaire_link : 1,
      log_link: 1,
    }
    ]
    return await Promise.all(contents.map(links => {
      return insertRequest.run([links.name, links.content_link, links.nb_upvote_link, links.nb_downvote_link, links.nb_commentaire_link, links.log_link])
    }))
  }
  
  async function createComs(db){
    const insertRequest = await db.prepare("INSERT INTO coms(content_com, nb_upvote_com, nb_downvote_com, link_com, log_com) VALUES(?, ?, ?, ?, ?)")
    const contents = [{
      content_com: "Excellent site pour faire des recherches!",
      nb_upvote_com: 1,
      nb_downvote_com: 0,
      link_com: 1,
      log_com: 2
    }
    ]
    return await Promise.all(contents.map(coms => {
      return insertRequest.run([coms.content_com, coms.nb_upvote_com, coms.nb_downvote_com, coms.link_com, coms.log_com])
    }))
  }

  async function createVotes(db){
    const insertRequest = await db.prepare("INSERT INTO votes(type_vote, log_vote, link_vote, com_vote) VALUES(?, ?, ?, ?)")
    const contents = [{
      type_vote: 1,
      log_vote: 1,
      link_vote: 0,
      com_vote: 1
    }
    ]
    return await Promise.all(contents.map(votes => {
      return insertRequest.run([votes.type_vote, votes.log_vote, votes.link_vote, votes.com_vote])
    }))
  }

  async function createTables(db){
    const logs = db.run(`
      CREATE TABLE IF NOT EXISTS logs(
        log_id INTEGER PRIMARY KEY,
        mail varchar(255),
        log_name varchar(255),
        pwd varchar(255),
        last_session int DEFAULT(0)
      )
    `)
    const links = db.run(`
          CREATE TABLE IF NOT EXISTS links(
            link_id INTEGER PRIMARY KEY,
            content_link text,
            name varchar(255),
            nb_upvote_link int DEFAULT(0),
            nb_downvote_link int DEFAULT(0),
            link_date int DEFAULT(0),
            nb_commentaire_link int DEFAULT(0),
            log_link int,  --To know who posted this link
            FOREIGN KEY(log_link) REFERENCES logs(log_id)
          )
    `)
    const coms = db.run(`
        CREATE TABLE IF NOT EXISTS coms(  
            com_id INTEGER PRIMARY KEY,
            content_com text,
            nb_upvote_com int,
            nb_downvote_com int,
            com_date int DEFAULT(0),
            link_com int, --To know the link the com is on
            log_com int, --To know who posted this com 
            FOREIGN KEY(link_com) REFERENCES links(link_id),
            FOREIGN KEY(log_com) REFERENCES logs(log_id)
          )
    `)
    const votes = db.run(`
        CREATE TABLE IF NOT EXISTS votes(  
            vote_id INTEGER PRIMARY KEY,
            type_vote int, --1 for upvote and -1 for downvote
            vote_date int DEFAULT(0),
            log_vote int,  --To know who is the owner of this vote
            link_vote int, --0 if the vote is on a com 
            com_vote int,  --0 if the vote is on a link
            FOREIGN KEY(log_vote) REFERENCES logs(log_id),
            FOREIGN KEY(link_vote) REFERENCES links(link_id),
            FOREIGN KEY(com_vote) REFERENCES coms(lcom_id)
          )
    `)
    return await Promise.all([logs,links,coms,votes])
  }
  
  
  async function dropTables(db){
    return await Promise.all(tablesNames.map( tableName => {
        return db.run(`DROP TABLE IF EXISTS ${tableName}`)
      }
    ))
  }
  
  (async () => {
    // open the database
    let db = await openDb()
    await dropTables(db)
    await createTables(db)
    await createLogs(db)
    await createLinks(db)
    await createComs(db)
    await createVotes(db)
  })()