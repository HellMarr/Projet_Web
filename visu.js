const bodyParser = require('body-parser');
const express = require('express');

const {openDb} = require("./db")

const app = express()
const port = 4000

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



app.set('views', './Views');
app.set('view engine', 'jade');

app.get("/", async(req,res) => {
    const db=await openDb()
      const dataDb=await db.all(`
      SELECT * FROM logs
      `)
      console.log(dataDb)
    const data = {
      tables:dataDb
    }
    res.render("projet",data)
  })


app.listen(port,() => {
    console.log("Listening on port ", port)
  })