// Libraries
var express = require('express');
var Q = require('q');
var httpRequest = require('request');
var mongo = require('mongodb').MongoClient;

// Configuration
var CAMPAIGN_GOAL = 1000;  // Your fundraising goal in dollars
var BALANCED_MARKETPLACE_URI = "/v1/marketplaces/TEST-MP4oydl7HkIFWsZq1QKkiP2o";
var BALANCED_API_KEY = "905c780eeb3011e2a56e026ba7c1aba6";
//var MONGO_URI = process.env.MONGOHQ_URL;
var MONGO_URI = "mongodb://gertie:idgie@dharma.mongohq.com:10067/app16877788";

// Initialize the Express app
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

    // TODO: Charge card using Balanced API

    Q.fcall(function() {
	// Create an account with Card URI
	return _callBalanced("/accounts", {
	    card_uri: card_uri
	});
    }).then(function(account) {
	// Charge said account for the given amount
	return _callBalanced("/debits", {
	    account_uri: account.uri,
	    amount: Math.round(amount*1000) // Convert from dollars to cents
        });
    }).then(function(transaction) {
	// Donation data
	var donation = {
	    name: name,
	    amount: transaction.amount/100, // Convert back from cents to dollars.
	    transaction: transaction
	};

	// TODO: Record transaction in database
	return _recordDonation(donation);
    }).then(function(donation) {
        // Personalized Thank You Page
        response.send(
            "<link rel='stylesheet' type='text/css' href='/static/fancy.css'>"+
            "<h1>Thank you, "+donation.name+"!</h1> <br>"+
            "<h2>You donated $"+donation.amount.toFixed(2)+".</h2> <br>"+
            "<a href='/'>Return to Campaign Page</a> <br>"+
            "<br>"+
            "Here's your full Donation Info: <br>"+
            "<pre>"+JSON.stringify(donation,null,4)+"</pre>"
	);
    }, function(err) {
	response.send("Error: " + err); 
    });


});


// Recording a Donation
function _recordDonation(donation) {
    // Promise saving to a database
    var deferred = Q.defer();
    mongo.connect(MONGO_URI, function(err, db) {
	if(err) { return deferred.reject(err); }
	
	// Insert donation
	db.collection('donations').insert(donation, function(err) {
	    if(err) { return deferred.reject(err); }
	    
	    // Promise the donation you just saved
	    deferred.resolve(donation);

	    // Close database
	    db.close();
         });
    });
    return deferred.promise;
}

// Calling the balanced REST API
function _callBalanced(url, params) {
    // Promise an HTTP Post Request
    var deferred = Q.defer();
    httpRequest.post({
	url: "https://api.balancedpayments.com" + BALANCED_MARKETPLACE_URI + url,
	auth: {
	    user: BALANCED_API_KEY, 
	    pass: "",
	    sendImmediately: true
	},
	json: params
    }, function(error, response, body) {
	// Handle all bad requests (error 4xx) or Internal server errors (error 5xx)
	if(body.status_code >=400) {
	    deferred.reject(body.description);
	    return;
	}

	// Successful requests
	deferred.resolve(body);
    });
    return deferred.promise;
}
