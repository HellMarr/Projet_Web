//Initialisation base de données avec ajout des données demandées de base.

const {openDb} = require("./db")

const tablesNames = ["logs","links","coms","votes"]

async function createLogs(db){
    const insertRequest = await db.prepare("INSERT INTO logs(log_name,pwd) VALUES(?,?)")
    const contents = [{
        log_name: "max",
        pwd: "max"
    },
      {
        log_name: "bob",
        pwd: "bob"
      }
    ]
    return await Promise.all(contents.map(logs => {
      return insertRequest.run(logs.log_name, logs.pwd)
    }))
  }
  
  async function createLinks(db){
    const insertRequest = await db.prepare("INSERT INTO links(name, nb_upvote, nb_downvote, log) VALUES(?, ?, ?, ?)")
    const contents = [{
      name: "http://google.fr",
      nb_upvote: 0,
      nb_downvote: 0,
      log: 1
    }
    ]
    return await Promise.all(contents.map(links => {
      return insertRequest.run([links.name, links.nb_upvote, links.nb_downvote, links.log])
    }))
  }
  
  async function createComs(db){
    const insertRequest = await db.prepare("INSERT INTO coms(content, nb_upvote, nb_downvote, link) VALUES(?, ?, ?, ?)")
    const contents = [{
      content: "Excellent site pour faire des recherches!",
      nb_upvote: 1,
      nb_downvote: 0,
      link: 1
    }
    ]
    return await Promise.all(contents.map(coms => {
      return insertRequest.run([coms.content, coms.nb_upvote, coms.nb_downvote, coms.link])
    }))
  }

  async function createVotes(db){
    const insertRequest = await db.prepare("INSERT INTO votes(type_vote, log, link, com) VALUES(?, ?, ?, ?)")
    const contents = [{
      type_vote: "upvote",
      log: 1,
      link: 0,
      com: 1
    }
    ]
    return await Promise.all(contents.map(votes => {
      return insertRequest.run([votes.type_vote, votes.log, votes.link, votes.com])
    }))
  }

  async function createTables(db){
    const logs = db.run(`
      CREATE TABLE IF NOT EXISTS logs(
        log_id INTEGER PRIMARY KEY,
        log_name varchar(255),
        pwd varchar(255)
      )
    `)
    const links = db.run(`
          CREATE TABLE IF NOT EXISTS links(
            link_id INTEGER PRIMARY KEY,
            name varchar(255),
            nb_upvote int,
            nb_downvote int,
            log int,  --To know who posted this link
            FOREIGN KEY(log) REFERENCES logs(log_id)
          )
    `)
    const coms = db.run(`
        CREATE TABLE IF NOT EXISTS coms(  
            com_id INTEGER PRIMARY KEY,
            content text,
            nb_upvote int,
            nb_downvote int,
            link int, --To know the link the com is on
            FOREIGN KEY(link) REFERENCES links(link_id)
          )
    `)
    const votes = db.run(`
        CREATE TABLE IF NOT EXISTS votes(  
            vote_id INTEGER PRIMARY KEY,
            type_vote varchar(255), --upvote or downvote
            log int,  --To know who is the owner of this vote
            link int, --0 if the vote is on a com 
            com int,  --0 if the vote is on a link
            FOREIGN KEY(log) REFERENCES logs(log_id),
            FOREIGN KEY(link) REFERENCES links(link_id),
            FOREIGN KEY(com) REFERENCES coms(lcom_id)
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