// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const Arweave = require('arweave');
const cors = require('cors');
const {interactWrite, readContract} = require('smartweave');
const key = {
   "kty":"RSA",
   "n":process.env.n,
   "e":"AQAB",
   "d":process.env.d,
   "p":process.env.p,
   "q":process.env.q,
   "dp":process.env.dp,
   "dq":process.env.dq,
   "qi":process.env.qi
}

var Twit = require('twit')
 
var T = new Twit({
  consumer_key:         process.env.apikey,
  consumer_secret:      process.env.secret,
  access_token:         process.env.accessToken,
  access_token_secret:  process.env.accessSecret,
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL:            true,     // optional - requires SSL certificates to be valid.
})
  

const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const axios = require('axios');

var profileLink = "https://pbs.twimg.com/profile_images/1345421667787558913/11Gicuk__400x400.jpg" //default

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(cors())

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

function renameKey ( obj, oldKey, newKey ) {
  obj[newKey] = obj[oldKey];
  delete obj[oldKey];
}

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Markets (id INTEGER PRIMARY KEY AUTOINCREMENT, market TEXT NOT NULL, tweetID TEXT NOT NULL)"
    );
    //db.run("CREATE TABLE Markets (id INTEGER PRIMARY KEY AUTOINCREMENT), market TEXT)");
    console.log("New table Markets created!");

    // insert default dreams
    db.serialize(() => {
      db.run(
        'INSERT INTO Markets (market, tweetID) VALUES ("Find and count some sheep", "123"), ("some other thing", "456")'
      );
    });
  } else {
    
    //console.log('Database "Dreams" ready to go!');
    db.each("SELECT * from Markets", (err, row) => {
      if (row) {
        //console.log(row);
      }
    });
  }
});

const getParentData = async (id) => {
        // await get tweetParent
        const returnData = await T.get('statuses/show/:id', { id:id }).then((res ) => {
          console.log("93 log " + res.data["in_reply_to_status_id_str"])
          return res.data;
        });
    console.log("returnData log " + returnData["in_reply_to_status_id_str"])
    return returnData;
}

const recursiveGetParentData = async (childId) => {
  console.log("calling on " + childId)
    const parentData = await getParentData(childId)
    const parentId = parentData["in_reply_to_status_id_str"]
    console.log("found parent id " + parentId)
    if (parentId){ return recursiveGetParentData(parentId)}
    return parentData
}

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  //response.sendFile(`${__dirname}/views/index.html`);
  
  var tweetStr = "https://twitter.com/e_con24/status/1363249468129251328"
  var id = tweetStr.split("status/")[1]
  
  T.get('statuses/show/:id', { id:id }, async function(err, data, res) {
    //console.log(data)
    console.log(id)
    var inreply = data["in_reply_to_status_id_str"]
    console.log("first inreply = " + inreply)
    
    let topTweetId, topTweetData;
    if(inreply == null){
      console.log("This is top level. Done.")
    }else{
      topTweetData = await recursiveGetParentData(inreply)
      console.log("top found tweet = " + topTweetData["id_str"])
    }
    inreply = topTweetData["id_str"];
    data = topTweetData;
    if(inreply){
      //these are different. this is a reply.
      console.log("this is a reply")
    }else{
      console.log("this is top level?? = " + data["id_str"])
    }
    response.send(data);//this is the original user req
  });
});

async function loopupReply(){
  
}


// endpoint to get all the dreams in the database
app.get("/getDreams", (request, response) => {
  db.all("SELECT * from Markets ", (err, rows) => { //WHERE tweetID='123'
    console.log("Getting all")
    console.log(JSON.stringify(rows))
    response.send(JSON.stringify(rows));
  });
});


// endpoint to get all the markets in the database
app.get("/getMarket/:id", (request, response) => {
  var idItem = request.params.id;
  db.all("SELECT * from Markets WHERE id = '" + idItem + "'", (err, rows) => {
    var item = rows[0]["market"]
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
    db.run(`INSERT INTO Markets (market, tweetID) VALUES (?, ?)`, [cleansedDream, "4"], error => {
      if (error) {
        console.log("insert err")
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
        console.log("insert succ")
      }
    });
  }
});

// endpoint to clear markets from the database
app.get("/clearDreamslPrYh93r6pV18QSJkNIb", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Markets",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Markets WHERE ID=?`, row.id, error => {
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

//============== Twitter Events Events =================//
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

app.get("/manualPostUpdate", (request, response)  => {
  console.log("connected")
  var data = {
    "link":"https://twitter.com/CupOJoseph/status/1357555124764368897",
    "username":"cupojoseph",
    "yays":1,
    "nays":1,
    "marketID":"1tuBuFOMVgN1o9yKBXyB2JOO_qrZpGSmIxE84dp9foo"
  }
  postConclusion(data)
  response.send(`Are you sure you should be here?`);
});

//async call to get the data for any tweet
async function checkUpdatesTweet(tweetId){
  await T.get('statuses/show/:id', { id:tweetId }, function(errCheck, dataCheck, resTopCheck) {   
        return dataCheck;
      }); 
}

//Main create market called by Ifttt upon comments
app.post("/QpRQ2ozTMn07RmC0ZMdKVZ7zsQF7uZ", (request, response)  => {
  console.log("Found a thing!\n")
  console.log(request.body);
  var data = request.body
  /** example data
  {
  text: '@trade_consensus  EIP 1559 will ship in 2021',
  username: 'CupOJoseph',
  link: ' http://twitter.com/CupOJoseph/status/1357555124764368897',
  timestamp: 'February 05, 2021 at 12:02AM'
  }  
  **/
  
  //Check that this tweet ID top level has not been used to make a thing before
  var tweetID = data["link"].split("status/")[1]
  var tweetTopID = ""
  let topTweetData;
  
  // check if the currently sent tweet is the top level
  T.get('statuses/show/:id', { id:tweetID }, async function(errtopCheck, dataTopCheck, resTopCheck) {
    var inreply = dataTopCheck["in_reply_to_status_id_str"]
    
    //set correct top level ID
    if(inreply){
      //these are different. this is a reply.
 
      topTweetData = await recursiveGetParentData(inreply)
      //Update Data
      data["text"] = topTweetData["text"]
      tweetTopID = topTweetData["id_str"];
      data["username"] = topTweetData["user"]["screen_name"]
      data["link"] = `https://twitter.com/${data['username']}/status/${tweetTopID}`     
      
    }else{//inrply is null
      console.log("this is top level already..")
      //data that we got in from original body is correct
      tweetTopID = tweetID
    }
    
    
    
    
    //Check if top level tweet ID is in db
      var sqlById = "SELECT * from Markets WHERE tweetID = '" + tweetTopID + "'"
      console.log("boken call: " + sqlById)
        db.all(sqlById, function(errLookup, rowLookup) {

            if(errLookup){
              console.log(errLookup);
              response.sendStatus(400)
              return;
            }
            else if(rowLookup != ""){
              console.log("Row already exists @@@!!!")
              response.send("RowLookup: " + JSON.stringify(rowLookup) + "\r\nAlready exists")
              return
            }else{
              console.log("No row found, let's make a market and stuff.")
              
              response.type('application/json');
              response.sendStatus(200).end;

              // manually specify a host
              const arweave = Arweave.init({
                    host: 'arweave.net',// Hostname or IP address for a Arweave host
                    port: 443,          // Port
                    protocol: 'https',  // Network protocol http or https
                    timeout: 20000,     // Network request timeouts in milliseconds
                    logging: false,     // Enable network request logging
                });
              const experimentContract = "f1wibc4fPQbcOtHR9ZlcfiJZicJSHA2mgETC-3WHMME";
              //const timeLockContract = "8zGVX17V6u3Uzn2fWJFya3vEuPOvIZ6FRifUDhaprtE";
              //const fastTestingContract = "HJfFTVxB0kSkr2Q5soVYtoMN4nZd-WZHs1Kv0g2lHuY";
              const stagingContract = "1xFNdOU1egZUCBlbpx7iO-Ew4PYLCx8O3OwtyDCR78E";


              //sanity check to make sure arweave wallet is loaded correctly
              //arweave.wallets.jwkToAddress(key).then((address) => {console.log(address); });

              data["marketID"] = "igf_P-agfMpa01wsXRxwY0JXsVgbPQR5N_mc-uAPd8s" //default
              // makes calls to smartweave
              //
              var dateStr = data["timestamp"]
              if (!dateStr.includes(" AM") && !dateStr.includes(" PM")){
                dateStr = dateStr.replace("AM", " AM");
                dateStr = dateStr.replace("PM", " PM");
                dateStr = dateStr.replace("at ", "");
                console.log("~~~~ final datestr= " + dateStr)

              }
              var dateparsed = Date.parse(dateStr);
              //get user profile image
              T.get('users/show', { "screen_name": data["username"] }, function (err, profData, res) {
                //res.sendStatus(200).end

                profileLink = profData["profile_image_url"]
                profileLink = profileLink.replace("_normal.jpg",".jpg")

                const contractInput = {
                  function: 'createMarket',
                  "tweet":data["text"],
                  "tweetUsername":data["username"],
                  "tweetPhoto":profileLink,
                  "tweetCreated":dateparsed,
                  "tweetLink":data["link"]
                }
                console.log("=== contract inpute === ")
                console.log(contractInput)

                interactWrite(arweave, key, experimentContract, contractInput)
                .then((contractResult) =>{
                  console.log("===== Contract Result =====");
                  console.log(contractResult)
                  data["marketID"] = contractResult;
                  postTweet(data); //calls another async function to post result

                  db.run(`INSERT INTO Markets (market, tweetId) VALUES (?, ?)`, [contractResult, tweetTopID], error => {
                    if (error) {
                      console.log("failed to add for : " + err);
                    } else {
                      console.log("added successfully to save market and tweet id");
                    }
                  });

                });

                //SEND post tweet
                //Value1 = username
                //Value2 = text
                //Value3 = time
                //post url = https://maker.ifttt.com/trigger/qhAcrkf8/with/key/bhsXIIDyGULGSiSPMZ7cWSw-vSn3myvzpCfAM3XVQ6c
                })
            
            }

          });
  });  
});

app.get("/QpRQ2ozTMn07RmC0ZMdKVZ7zsQF7uZ", (request, response)  => {
  console.log("connected")
  response.send(`Why are you here?`);
});


// =========== Post Updates =========== //
//daily updater hit by ifttt at noon
app.get("/dailyUpdate_LVJjpq64Z3rt7BMYcNYyPXHrOJWUEryftapNo5rw", (request, response)  => {
  console.log("Try posting with the marketID in the body.")
  
  const arweave = Arweave.init({
        host: 'arweave.net',// Hostname or IP address for a Arweave host
        port: 443,          // Port
        protocol: 'https',  // Network protocol http or https
        timeout: 20000,     // Network request timeouts in milliseconds
        logging: false,     // Enable network request logging
    });
  const experimentContract = "f1wibc4fPQbcOtHR9ZlcfiJZicJSHA2mgETC-3WHMME";
  
  readContract(arweave, experimentContract).then((contractState) => {
    
    var markets = contractState.markets;
    
    console.log("MARKETS READ")
    
    for(var market in markets){
      //console.log(market+": "+ markets[market]);
      var expireTime = markets[market]["endTime"];
            if (expireTime < Date.now()){
            //send ending tweet and cleanup
              console.log("expired: " + market)
            }else{
              console.log("market open: " + market)
              
              /**var updatePostData = {
                "username":markets[market]["tweetUsername"],
                "link":markets[market]["tweetLink"],
                "yays":markets[market]["nays"],
                "nays":markets[market]["yays"],
                "marketID":market
              }**/
              var ctUrl = "https://consensus-trade-git-experimental.manolingam.vercel.app/market/" + market
              var now = Date.now()
              var currTime = new Date(now)
  
              var status =  "@" + markets[market]["tweetUsername"] + " Looks like " + "@" + markets[market]["tweetUsername"] + "'s tweet market on Consensus Trade is still open as of " + currTime.toTimeString().split(" (")[0] + "! Check out the market for this tweet here: " + ctUrl + " \r\nCurrent Yays: " + markets[market]["yays"] + "\r\n Current Nays: " + markets[market]["nays"];

              T.post('statuses/update', { status: status,  "in_reply_to_status_id":markets[market]["tweetLink"].split("status/")[1]}, function(err, data, response) {
                console.log(err)
              });
            }
    } 
    
    response.type('application/json');
    response.send(markets).end;
  });
  
  
});

//user update makret, clicked by user when market is over from FE. recieves a market ID
app.post("/updateMarket_LVJjpq64Z3rt7BMYcNYyPXHrOJWUEryftapNo5rw", (request, response)  => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  console.log("connected to update poster");
    const arweave = Arweave.init({
        host: 'arweave.net',// Hostname or IP address for a Arweave host
        port: 443,          // Port
        protocol: 'https',  // Network protocol http or https
        timeout: 20000,     // Network request timeouts in milliseconds
        logging: false,     // Enable network request logging
    });
  const experimentContract = "f1wibc4fPQbcOtHR9ZlcfiJZicJSHA2mgETC-3WHMME";
  //check open markets from check list
  db.all("SELECT * from Markets", (err, rows) => {
    //console.log("rows: ")
    //console.log(rows)
    var i = 0;
    for (i = 0; i < rows.length; i++ ){
      console.log("checking market: ");
      console.log(rows[i]);
    }
    response.type('application/json');
    var resData = {};
    resData["checked"] = rows;
      // manually specify a host

    var marketID = "x"
    if(request.body.hasOwnProperty('marketID')){
      marketID = request.body['marketID'];
      
      readContract(arweave, experimentContract).then((contractState) => {
          var market = contractState.markets[marketID];
          console.log("Checking the " + marketID + " Market in storage: ")
          //console.log(JSON.stringify(contractState.markets))
          
          if(!market.hasOwnProperty("endTime")){
            //response.send({"err":"Request was recieved but the market " + marketID + " had no property endTime"}).end;
            //return
            console.log("No end time on the market.")
            var data = {}
            data["marketID"] = marketID;
            data["yays"] = market["yays"]
            data["nays"] = market["nays"]
            data["link"] = market["tweetLink"]
            data["username"] = market["tweetUsername"]
          
            postConclusion(data);
            //TODO remove item from db
            db.each("SELECT * from Markets WHERE market=" + marketID +"'" , (delerr, delrow) => {
              if (delrow) {
                db.run(`DELETE FROM Markets WHERE ID=?`, delrow.id, error => {
                  if (delrow) {
                      console.log("deleted row " + JSON.stringify(delrow));
                    }
                  });
              }else{
                console.log("del row err: ")
                console.log(delerr)
              }
            });
            
            response.send(resData).end;
          }else{
            var expireTime = market["endTime"];
            if (expireTime < Date.now()){
            //send ending tweet and cleanup
              console.log("!!!!!! The market had an end time. Doing nothing. !!!!!!")
              response.send(resData).end;
            }
          }
      })
    }
    else{
      console.log("No market ID prop on request.")
      resData["info"] = "No market ID prop on request.";
      response.send(resData).end;  
    }
  });
  
});