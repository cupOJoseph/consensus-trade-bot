// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const Arweave = require('arweave');
const key = {}
  

const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Dreams (id INTEGER PRIMARY KEY AUTOINCREMENT, dream TEXT)"
    );
    db.run("CREATE TABLE Markets (id INTEGER PRIMARY KEY AUTOINCREMENT), market TEXT)");
    console.log("New table Markets created!");

    // insert default dreams
    db.serialize(() => {
      db.run(
        'INSERT INTO Dreams (dream) VALUES ("Find and count some sheep"), ("Climb a really tall mountain"), ("Wash the dishes")'
      );
    });
  } else {
    
    console.log('Database "Dreams" ready to go!');
    
    db.each("SELECT * from Dreams", (err, row) => {
      if (row) {
        console.log(`record: ${row.dream}`);
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to get all the dreams in the database
app.get("/getDreams", (request, response) => {
  db.all("SELECT * from Dreams", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to get all the dreams in the database
app.get("/getMarkets", (request, response) => {
  db.all("SELECT * from Dreams", (err, rows) => {
    response.send(JSON.stringify(rows));
  });
});

// endpoint to get all the dreams in the database
app.get("/getMarket/:id", (request, response) => {
  var idItem = request.params.id;
  db.all("SELECT * from Dreams WHERE id = " + idItem, (err, rows) => {
    var item = rows[0]["dream"]
    response.send(item);
  });
});


// endpoint to add a dream to the database
app.post("/addDream", (request, response) => {
  console.log(`add to dreams ${request.body.dream}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedDream = cleanseString(request.body.dream);
    db.run(`INSERT INTO Dreams (dream) VALUES (?)`, cleansedDream, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
});

// endpoint to clear dreams from the database
app.get("/clearDreamslPrYh93r6pV18QSJkNIb", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Dreams",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Dreams WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          response.send({ message: "error!" });
        } else {
          response.send({ message: "success" });
        }
      }
    );
  }
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

//============== Stream Events =================//
function postTweet(data){
  var textSource = data["text"]
  var username = data["username"]
  var link = data["link"]
  var time = data["timestamp"]
  
  var ctUrl = "https://consensus-trade-git-experimental.manolingam.vercel.app/market/" + data["marketID"]
  
  //the url to send the post to
  var postUrl = "https://maker.ifttt.com/trigger/Post_A_Tweet/with/key/bhsXIIDyGULGSiSPMZ7cWSw-vSn3myvzpCfAM3XVQ6c"
  
  //console.log()
  var length = textSource.length
  if(length > 140){
    textSource = textSource.substr(0,140) + "... "
  }
  //Must use these keys 
  var postBody = {
    "value1":username,
    "value2":textSource,
    "value3":ctUrl
  }
  var twitterApiUrl = "https://api.twitter.com/1.1/statuses/update.json";
  
  var twitterReplyId = data["link"].slice(data["link"].lastIndexOf('/') + 1);
  var userString = "@" + username
  
  var status =  userString + " Hey! " + userString + " just posted a tweet that will be saved on Consensus Trade. Check out the market for this tweet and stake on it here: " + ctUrl;
  
  T.post('statuses/update', { status: status,  "in_reply_to_status_id":twitterReplyId}, function(err, data, response) {
  console.log(err)
})
  

  
  console.log("== post body to send to twitter ==");
  console.log(postBody)
  
  /*axios.post(postUrl, postBody)
    .then((res) => {
        console.log(`Status: ${res.status}`);
        console.log('Body: ', res.data);
    }).catch((err) => {
        console.error(err);
    });*/ //ifttt post here. but we're using twit now.
}

function postConclusion(data){
  var username = data["username"]
  var link = data["link"]
  var yays = data["yays"]
  var nays = data["nays"]
  
  var twitterReplyId = data["link"].slice(data["link"].lastIndexOf('/') + 1);
  var userString = "@" + username
  
  var ctUrl = "https://consensus-trade-git-experimental.manolingam.vercel.app/market/" + data["marketID"]
  
  var status =  userString + " Looks like " + userString + "'s tweet market on Consensus Trade has been finalized! Check out the final market for this tweet here: " + ctUrl + " \r\nYays: " + yays + "\r\nNays: " + nays;
  
  T.post('statuses/update', { status: status,  "in_reply_to_status_id":twitterReplyId}, function(err, data, response) {
    console.log(err)
  });
}

//============== Stream Events =================//
app.post("/QpRQ2ozTMn07RmC0ZMdKVZ7zsQF7uZ", (request, response)  => {
  console.log("Found a thing!\n")
  console.log(request.body);
  var data = request.body
  // manually specify a host
  const arweave = Arweave.init({
        host: '127.0.0.1',
        port: 1984,
        protocol: 'http'
    });
  
  arweave.wallets.jwkToAddress(key).then((address) => {
    console.log(address); });
  
  // makes calls to smartweave
  
  response.type('application/json');
  response.sendStatus(200).end;
  
  //SEND post tweet
  //Value1 = username
  //Value2 = text
  //Value3 = time
  //post url = https://maker.ifttt.com/trigger/qhAcrkf8/with/key/bhsXIIDyGULGSiSPMZ7cWSw-vSn3myvzpCfAM3XVQ6c
});

app.get("/QpRQ2ozTMn07RmC0ZMdKVZ7zsQF7uZ", (request, response)  => {
  console.log("connected")
  response.send(`Why are you here?`);
});

//========== arweave ===========//
