
/**
 * Other : Osnat Drain - osnatairy@gmail.com
 * Help with everything : Erel Segal Halevi - erelsgl@gmail.com
 * Initialize a new agent. 
 * @param socket - a socket.io client that this agent will use to connect to the negotiation server.
 */

var util = require('util');

var ACCEPT = 5000;
var REJECT = 5000;
var NO_COMMENT = 5000;

exports.Agent = function (name, agent, socket, role, type,counry) {
  	var role = role;
	var agent = agent;
	var userid = this.userid = name + new Date().toISOString();
	var myLastBid;
	var oppLastBid = {};
	var curSratus;
	var gameid = gameid;
	var curTurn = 0;
	var gameIsOn = false;
	var agreed = false;
	var somethingHappend = false;
	var compromise = false;
	var offerSomething = false;
	var checkTurn = 1;
	var offers;
	var oppReaction = false;
	agent.socket = socket;
	var counter = 0;
	var waitingTime = counry == "egypt"? 32000:25000;
	var waitingRespondTime = counry == "egypt"? 32000 : 4000;
	var newType = type;


	offers = setInterval(function(){
		counter++;
		if (!somethingHappend && !compromise && !agreed){
			if(oppReaction){
				if(agent.B.length == agent.issuesLength){
					socket.emit('message', "We can sign the agreement now.");
					agreed = true;
					return;
				}

				var temp = agent.pickBid(curTurn);
				if (temp){ // if he finds an offer
					if (checkTurn != curTurn){ // he checks if the turn was changed and if so he: 
						checkTurn = curTurn;
						var equalTemp = true; //check if the current offer is like the one before
						if(myLastBid)
							for(issue in temp){
								if(!myLastBid.hasOwnProperty(issue))
									equalTemp = false
								else
									if(temp[issue] != myLastBid[issue])
										equalTemp = false;
						}
						myLastBid = clone(temp);
						if (equalTemp){ // if the current offer isn't like the one befor he suggest the offer as usual
							offerOut = makeFormat(temp);
							socket.emit('negoactions', offerOut);
							socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
							somethingHappend = true;
							return;
						}
						else{ //if the current offer is like the one befor he say the follow:
							offerOut = makeFormat(myLastBid);
							socket.emit('message', "Since time is running out and we are losing points, I am once again suggesting my previous offer:");
							socket.emit('negoactions', offerOut);
							return;
						}
					}
					else{ // if the turn havn't changed yet he offer as usual.
						myLastBid = clone(temp);
						var offerOut =  makeFormat(myLastBid);
						socket.emit('negoactions', offerOut);
						socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
						return;
					}
				}
				else{
					socket.emit('message', "Just a minute, I need to think a bit.");
					return;
				}
			}
			else{
				if(counter % 2 == 0){
					myLastBid = agent.pickFirstBid(curTurn);
					var offerOut = makeFormat(myLastBid);
					socket.emit('negoactions', offerOut);
					socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
					somethingHappend = true;
				}
			}

			
			
		}
		somethingHappend = false;
		compromise = false;
		offerSomething = false


	},waitingTime);

		
	socket.on('connect', function () { 
		setTimeout(function(){
			if(newType == "honor"){
				socket.emit('message', "It is an honor to meet you. I hope work together to to have a fair agreement and to get your trust that I can conform to this Job.");
				somethingHappend = true;
				setTimeout(function(){
					myLastBid = agent.pickFirstBid(curTurn);
					var offerOut = makeFormat(myLastBid);
					socket.emit('negoactions', offerOut);
					socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
					somethingHappend = true;
				},4000);
			}
			else{
				myLastBid = agent.pickFirstBid(curTurn);
				var offerOut = makeFormat(myLastBid);
				socket.emit('negoactions', offerOut);
				socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
				somethingHappend = true;
			}
		},5000);
	});

	socket.on('status',function (status) { 
		if ((status.value == "0:00") || (!gameIsOn)){
			clearInterval(offers);
		}
		curStatus = status;
		agent.status = status.value;
	});

	socket.on("EndGame", function(){
		console.log("END-GAME")
   		socket.emit("giveMeMyReservationUtility");
   		clearInterval(offers);
   		socket.disconnect();
    });

	socket.on('EndTurn', function (turn) { 
		if (curTurn !== turn){
			agent.recalculateSearchCluster(turn);
			curTurn = turn;
			console.log("A turn has ended: "+turn);
		}
	});

	socket.on('announcement', function (announcement) { 
		if (announcement.action == 'Connect')
			gameIsOn = true;
		if (announcement.action == 'Disconnect'){
			console.log("bey bey! :)");
			gameIsOn = false;
			clearInterval(offers);
			socket.disconnect();

		}
	});


	socket.on('negoactions', function (actions) { 
		oppReaction = true;
		somethingHappend = true;
		var newOppBid = {};
		if (actions.hasOwnProperty('Reject')){ // the opponent reject the agent's offer
			if (myLastBid==null){ 
					socket.emit('message', "What do you reject?");
			}
			else{
				var extchangeOffer;
				var issueNum = 0;
				for(issue in myLastBid)
					issueNum++;
				if (actions.Reject == "previous"){
					
					if(issueNum != agent.issuesLength){

						extchangeOffer = agent.opponentRejected(myLastBid, curTurn);
					}
					
				}
				else{
					extchangeOffer = agent.opponentRejected(actions.Reject, curTurn);
				}
				setTimeout(function(){
					if(extchangeOffer){
						if (!(isEqual(extchangeOffer[0], myLastBid)) && !(isEqual(extchangeOffer[0], oppLastBid))){
							myLastBid = {}
							for(var i=0; i<extchangeOffer.length; i++){
								if(extchangeOffer[i].valueOf("Object")){
									for (val in (extchangeOffer[i])){
										util._extend(myLastBid, extchangeOffer[i][val]);
									}
								}
							}

							if (!actions.hasOwnProperty('Offer') || !offerSomething){
								if(extchangeOffer){
									socket.emit('negoactions', extchangeOffer);
									socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
									return;
								}
								else{
									agent.wait = true;
									socket.emit('message', "Just a minute, I need to think a bit.");
									return;
								}
							}
						}
					}
					else if(issueNum == agent.issuesLength){
						socket.emit('message', "What do you suggest?");
						return;
					}
					else{
						socket.emit('message', "Just a minute, I need to think a bit.");
						return;
					}

					offerSomething = false;
					somethingHappend = true;
				},waitingRespondTime);
			}
		}
		if (actions.hasOwnProperty('Query')){
			var Query = actions.Query;
			if (typeof(actions.Query) != "string"){
				Query = actions.Query[0];
			}
			switch (Query) {
				case "bid":{
					setTimeout(function(){
						myLastBid = agent.pickBid(curTurn);
						if (myLastBid){
							if (myLastBid != "done"){
								var offerOut = makeFormat(myLastBid);
								socket.emit('negoactions', offerOut);
								socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
							}
							else{
								socket.emit('message', "I guess we discuss everything and we can sign the agreement");
							}
						}
						else{
							socket.emit('message', "Can you make a counter offer?");
						}
						somethingHappend = true;
					},waitingRespondTime);
					break;
				}
				case "issues":{
					setTimeout(function(){
						massage = agent.pickIssueForYou(curTurn);
						if(massage)
							socket.emit('message', massage);
						somethingHappend = true;
					},waitingRespondTime);
					break;
				}
				case "compromise":{
					compromise = true;
					setTimeout(function(){
						
						var comp = agent.tryToCompromise(curTurn);
						if (comp != undefined){
							myLastBid = comp;
							var offerOut = makeFormat(myLastBid);
							socket.emit('negoactions', offerOut);
							socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
						}
						else{
						socket.emit('message', "What are you willing to compromise?");
						}
						somethingHappend = true;
						compromise = true;
					},waitingRespondTime);
					break;
				}
				case "accept":{
					break;
				}

			}
		
		}

		if (actions.hasOwnProperty('Accept')){ // the opponent accept the agent's offer
			if (myLastBid==null){ 
				console.error("What do you accept? myLastBid is null");
			}
			else{
				var issueName = actions.Accept
				if (issueName == "previous"){
					util._extend(newOppBid, myLastBid);
				}
				else {
					if (!(issueName instanceof Array)){
						issueName = [issueName];
					}

					for(var i = 0; i < issueName.length; i ++){
						if (!(issueName[i] in myLastBid)) {
							console.error("How can you accept my offer about '"+issueName[i]+"'. when I even haven't offered it yet?")
						} else {
							newOppBid[issueName[i]]=myLastBid[issueName[i]];
						}
					}
				}
			}
		}

		if (actions.hasOwnProperty('Insist')){ // come as array and not as object - change it if it array do it else make it array. same in the accept
			if (oppLastBid==null){  //add the loop of the accept her too after I'll add the check of the arrays
					socket.emit('message', "What do you insist?");
			}
			else{
				var issueName = actions.Insist
				if (issueName == "previous"){
					util._extend(newOppBid, oppLastBid);
				}
				else {
					if (!(issueName instanceof Array)){
						issueName = [issueName];
					}

					for(var i = 0; i < issueName.length; i ++){
						if (!(issueName[i] in oppLastBid)) {
							console.error("How can you inssit my offer about '"+issueName[i]+"'. when you even haven't offered it yet?")
						} else {
							newOppBid[issueName[i]]=oppLastBid[issueName[i]];
						}
					}
				}				
			}
			
		}

		if (actions.hasOwnProperty('Append')){ // come as array and not as object - change it if it array do it else make it array. same in the accept
			if (oppLastBid==null){  //add the loop of the accept her too after I'll add the check of the arrays
					socket.emit('message', "What do you appand?");
			}
			else{
				var issueName = actions.Append
				if (issueName == "previous"){
					util._extend(newOppBid, oppLastBid);
				}
			}
		}

		if (actions.hasOwnProperty('Offer')){ // 'Offer in actions'
			util._extend(newOppBid, actions.Offer);
		}

		if (actions.hasOwnProperty('Greet')){ 
			setTimeout(function(){
				somethingHappend = true;
				socket.emit('negoactions', [{'Greet': true}]);
			},4000);
		}

		if (Object.keys(newOppBid).length==0) {  // only greet
			return;
		} else {
			var equal = true;
			if(myLastBid){
				for (issue in newOppBid){
					if(myLastBid){
						if (!myLastBid.hasOwnProperty(issue)) 
							equal = false;
						else
							if (myLastBid[issue] != newOppBid[issue])
								equal = false;
						}
				}
				for (issue in myLastBid){
					if (!newOppBid.hasOwnProperty(issue)) 
						equal = false;
					else
						if (myLastBid[issue] != newOppBid[issue])
							equal = false;

				}
			}
			else{
				equal = false;
			}
			if (equal) { // full accept
				var accept = agent.opponentAccepted(myLastBid, curTurn);
				socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
				setTimeout(function(){
					if (accept){
						if (accept == "done"){
							socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
							socket.emit('message', "I'm happy that you accept. We can sign the agreement now.");
							agreed = true;
							return;
						}
						else{
						//socket.emit('negoactions', {'Accept': myLastBid});
							socket.emit('message', "I'm happy that you accept."+JSON.stringify(myLastBid));
							socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
						
							myLastBid = {};
							var haveOffer = false;
							for(var i=0; i<accept.length; i++){
								if(accept[i].valueOf("Object")){
									for (val in (accept[i])){
										if(val == 'Offer'){
											util._extend(myLastBid, accept[i][val]);
											haveOffer = true;
										}
									}
								}
							}
							if(haveOffer){
								socket.emit('negoactions', accept);
								socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
							}
						}
					}
					somethingHappend = true;
				},waitingRespondTime);
			} 
			else {  // partial accept and/or new offers
				offerSomething == true;
				agentReplyAction = agent.checkBid(newOppBid, curTurn);
				oppLastBid = clone(newOppBid);
				setTimeout(function(){
					if (agentReplyAction){ 
						somethingHappend = true;

						for(var i=0; i<agentReplyAction.length; i++){
							if(agentReplyAction[i].valueOf("Object")){
								for (val in (agentReplyAction[i])){
									if(val == "Offer"){
										myLastBid= clone(agentReplyAction[i][val]);
										socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
									}
									if(val == 'ChangeIssue'){
										util._extend(myLastBid, agentReplyAction[0]['Accept']);
										socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
									}
									if(val == 'StartNewIssue'){
										//socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
										socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
										myLastBid = clone(oppLastBid);
									}
									if(val == 'currentAgreement'){
										//socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
										socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
										myLastBid = clone(oppLastBid);
										agentReplyAction.splice(i,1);
										i--;

									}
								}
							}
						}
						socket.emit('negoactions', agentReplyAction);
						socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agent.B_Rely, role: role});
					}
					somethingHappend = true;
				},waitingRespondTime);
				
			}
		}
					
	});
	
	socket.on('sign', function (data) { //the agent allwas sign after the opponent so we won't get to infinit loop.
		var proposer = data.id + (data.you? " (You)": "");
		if(newType == "honor"){
			socket.emit('message', " I want to thank you about your help, transparency, modesty and patience. I of course I will be committed with you. ");
			//check if the agreement is the same as the one in my last bid or his last bid with flag = true.
			setTimeout(function(){
				socket.emit('sign' ,data.agreement );
				clearInterval(offers);
				socket.disconnect();
			},3000);
			
		}
		else{
			socket.emit('sign' ,data.agreement );
			clearInterval(offers);
			socket.disconnect();
		}
	});

	socket.on('yourPartnerOpt-out', function (){
		console.log("yourPartnerOpt-out");
		socket.emit('opt-out', true);
		clearInterval(offers);
		socket.disconnect();
	});

	socket.on("EndGame", function(){
		socket.emit("giveMeMyReservationUtility");
		clearInterval(offers);
		socket.disconnect();
	});

	socket.on('Disconnect', function (status) {
		clearInterval(offers); 

		console.log("bey bey! :)");
	});
}

function clone(obj){
    if(obj == null || typeof(obj) != 'object'){
      return obj;
    }
    else{

    var temp = obj.constructor(); // changed

    for(var key in obj)
        temp[key] = clone(obj[key]);
    return temp;
  }
}

function isEqual(obj1, obj2){
	var equal = true;
	for (i in obj1){
		if(obj2.hasOwnProperty(i)){
			if(obj1[i] != obj2[i])
				equal = false;
		}
		else
			equal= false;
	}
	for (i in obj2){
		if(obj1.hasOwnProperty(i)){
			if(obj1[i] != obj2[i])
				equal = false;
		}
		else
			equal= false;
	}
	return equal;
}

function makeFormat(temp){
	var offerOut = [];
	for(offer in temp){
	    var out = {};
	    out[offer] = temp[offer];
	    offerOut.push({"Offer":out})
	}
	return offerOut;
}