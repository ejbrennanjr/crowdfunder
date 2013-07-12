// Configuration
var CAMPAIGN_GOAL = 1000;  // Your fundraising goal in dollars
var BALANCED_MARKETPLACE_URI = "/v1/marketplaces/TEST-MP4oydl7HkIFWsZq1QKkiP2o";
var BALANCED_API_KEY = "905c780eeb3011e2a56e026ba7c1aba6";



// Initialize the Express app
var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
app.use("/static", express.static(__dirname + '/static')); // Serve static files
app.use(express.bodyParser()); // Can parse POST Requests
app.listen(port, function() {
                    console.log("Listening on " + port);
                 });

// Serve homepage
app.get("/", function(request, response) {
    // ToDo: Actually get fundraising tool
    response.send(
	"<link rel='stylesheet' type='text/css' href='/static/fancy.css'>"+
        "<h1>Your Crowdfunding Campaign</h1>"+
        "<h2>raised ??? out of $" + CAMPAIGN_GOAL.toFixed(2) + "</h2>"+
        "<a href='/fund'>Fund This</a>"
    );
});

// Serve funding page
app.get("/fund", function(request, response) {
    response.sendfile("fund.html");
});


// Pay via Balanced
app.post("/pay/balanced", function (request, response) {
    // Payment Data
    var card_uri = request.body.card_uri;
    var amount = request.body.amount;
    var name = request.body.name;

    // Placehoder
    response.send("Your card URI is: " + request.body.card_uri);
});
