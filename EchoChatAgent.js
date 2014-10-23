
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

var sentences = [ "I’m sorry, but I still haven’t received your response.  What do you think about my offer?"
				 ,"What is your opinion on this point"
				 ,"Do you agree?"]

var suggestingRunOut;

var acceptnece;

var acceptBasic = "O.k. ";
var acceptHonor = "I'm happy that you accepted ";

var suggestingRunOutHonor = ["Since time is running out and we are losing points, Can you consider my offer of  ",
						"I'm sorry to take up so much of your time; I repeat my offer of ",
						"Since time is running out, could you please consider my previous offer of ",
						"We do not have so much time left. What do you think on my last proposal of ",
                        "Before our session ends, could you please consider my previous proposal of "]

var suggestingRunOutBasic = ["Since time is running out and we are losing points, I am once again suggesting ",
						"I'm sorry to take up so much of your time; I repeat my offer of ",
						"Since time is running out, could you consider my previous offer of ",
						"We do not have so much time left. What do you think on my last proposal of ",
                        "Before our session ends, could you consider my previous proposal of "]

var suggestingRunOutPlace = 0;

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
	var waitingTime = counry == "egypt"? 60000:25000;
	var waitingRespondTime = counry == "egypt"? 16000 : 4000;
	var newType = type;
	var anotherOffer = false;
	var doIt = true;
	var lastActions = {};

	var currActionsDo = {};

	var timeCheck = false;
	var time = 0;
	var cuttWaitingRespondTime = waitingRespondTime;
	var avarageTime;
	var timeArray = [waitingRespondTime,waitingRespondTime,waitingRespondTime];
	var placeArray = 0;
	var time_countTime;

	var greetingOnce = true;

	suggestingRunOut = (newType == "honor") ? suggestingRunOutHonor : suggestingRunOutBasic;
	acceptnece = (newType == "honor") ? acceptHonor : acceptBasic;

	var moveOn = true;

	time_countTime = setInterval(function(){
		if(!timeCheck){
			time++;
		}
		else{
			timeCheck = false;
			//calculate the avg.
			timeArray[placeArray] = time;
			placeArray = (placeArray + 1 == timeArray.length) ? 0 : (placeArray++);
			var allTime = 0;
			for (var i = 0; i < timeArray.length; i++) {
				allTime += timeArray[i];
			};
			avarageTime = (allTime/timeArray.length) * 1000;
			if(avarageTime < waitingRespondTime)
				cuttWaitingRespondTime = avarageTime;
			else
				cuttWaitingRespondTime = waitingRespondTime;
			time = 0;
		}
	},1000);

	offers = setInterval(function(){
		counter++;
		if (!somethingHappend && !compromise && !agreed){
			//put into "temp" the next bid - offer of his.
			if(oppReaction){
				var temp = agent.pickBid(curTurn);
				if (temp){ // if he finds an offer
					if(temp == "done"){
						agreed = true;
						socket.emit("message", "We can sign the agreement");
						return;
					}

					if (checkTurn != curTurn){ // he checks if the turn was changed and if so he: 
						checkTurn = curTurn;
			
						var equalTemp = true; //check if the current offer is like the one before
						
						for(issue in temp){
							if(myLastBid)
								if(!myLastBid.hasOwnProperty(issue))
									equalTemp = false
								else
									if(temp[issue] != myLastBid[issue])
										equalTemp = false;
						if(myLastBid && temp){
							if(Object.keys(temp).length != Object.keys(myLastBid).length)
								equalTemp = false;
							}
						}
						if (!equalTemp || !myLastBid){ // if the current offer isn't like the one befor or ther is no value in mylastbid he suggest the offer as usual
							myLastBid = temp;
							socket.emit('negoactions', [{'Offer' :myLastBid}]);
							socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
							return;

						}
						else{ //if the current offer is like the one befor he say the follow:
							var bidVal;
							var bidName;
							for (i in myLastBid){
								bidVal = myLastBid[i];
								bidName = i;

							}
							suggestingRunOutPlace = (suggestingRunOutPlace + 1 == suggestingRunOut.length) ? 0 : (suggestingRunOutPlace + 1) ;
							socket.emit('message', suggestingRunOut[suggestingRunOutPlace] + bidName + " : " + bidVal);
							return;
						}
					}
					else{ // if the turn havn't changed yet he offer as usual.
						myLastBid = clone(temp);
						socket.emit('negoactions', [{'Offer' :myLastBid}]);
						socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
						return;
					}
				}
				else{
					if (temp == "done")
						socket.emit('message', "I guess we discuss everything and we can sign the agreement");
				}
				 // if the agent couldn't find any offer he wait to the next turn for the cluster to recalculate.
				if (!temp){
					agent.wait = true;
					socket.emit('message', "Just a minute, I need to think a bit.");
					return;
				}
			}
			else{
				oppReaction = true;
				var place = Math.floor((Math.random() * (sentences.length) + 0));
				socket.emit('message', sentences[place]);
				
			}
			
		}
		somethingHappend = false;
		compromise = false;
		offerSomething = false

	},waitingTime);

		
	socket.on('connect', function () { 
		console.log("Hi, I am "+userid+", and I just connected to the negotiation server!" + type);
		
	});

	socket.on('status',function (status) { 
		if ((status.value == "0:00") || (!gameIsOn)){
			clearInterval(offers);
			clearInterval(time_countTime);
		}
		curStatus = status;
		agent.status = status.value;
	});

	socket.on("EndGame", function(){
		console.log("END-GAME")
   		socket.emit("giveMeMyReservationUtility");
   		clearInterval(offers);
   		clearInterval(time_countTime);
   		socket.disconnect();
    });

	socket.on('EndTurn', function (turn) { 
		if (curTurn !== turn){
			agent.recalculateSearchCluster(turn);
			curTurn = turn;
			agent.turn = turn;
			console.log("A turn has ended: "+turn);
			if(turn == 1){
				setTimeout(function(){
					somethingHappend = true;
					if(newType == "honor"){
						socket.emit('message', "It is an honor to meet you. I hope work together to have a fair agreement and to get your trust that I can conform to this Job.");
						setTimeout(function(){
							myLastBid = agent.pickFirstBid(curTurn);
							var offerOut = [];
							for(offer in myLastBid){
						        var out = {};
						        out[offer] = myLastBid[offer];
						        offerOut.push({"Offer":out})

						      }
							socket.emit('negoactions', offerOut);
							socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
							somethingHappend = true;
						},4000);
					}
					else{
						socket.emit('negoactions', [{'Greet': true}]);
						myLastBid = agent.pickFirstBid(curTurn);
						var offerOut = [];
						for(offer in myLastBid){
					        var out = {};
					        out[offer] = myLastBid[offer];
					        offerOut.push({"Offer":out})

					      }
					     
						
			
						socket.emit('negoactions', offerOut);
						socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
						somethingHappend = true;

					}
					
				},5000);
			}
		}
	});

	socket.on('announcement', function (announcement) { 
		if (announcement.action == 'Connect')
			gameIsOn = true;
		if (announcement.action == 'Disconnect'){
			console.log("bey bey! :) try to disconnect");
		}

	});


	socket.on('negoactions', function (currActionsChat) { 
		agreed = false;
		timeCheck = true;
		somethingHappend = true;
	
		if (currActionsChat.hasOwnProperty('Greet')){ 
			if(greetingOnce){
				greetingOnce = false;
				setTimeout(function(){
					socket.emit('negoactions', [{'Greet': true}]);
					return;
				},4000);
			}
		}
		if(currActionsChat.hasOwnProperty('Offer') && currActionsDo.hasOwnProperty('Offer'))
			util._extend(currActionsDo.Offer, currActionsChat.Offer);
		else
			util._extend(currActionsDo, currActionsChat);

		if(true){
			setTimeout(function(){
				var currActions = clone(currActionsDo);
				if(currActions.hasOwnProperty("Accept") && currActions.hasOwnProperty("Reject") )
					delete currActions.Accept;
				currActionsDo = {};
				oppReaction = true;
				somethingHappend = true;
			
				var newOppBid = {};
				if (currActions.hasOwnProperty('Reject')){ // the opponent reject the agent's offer
					var actions = currActions;
					if (myLastBid==null){ 
						
					}

					else{
						doIt = true;
						var extchangeOffer;
						var keepGoFind = true;
						if (actions.hasOwnProperty('Offer') || actions.hasOwnProperty('Append') || actions.hasOwnProperty('Accept')){
							keepGoFind = false;
						}
						if (actions.Reject == "previous"){
							extchangeOffer = agent.opponentRejected(myLastBid, curTurn, keepGoFind);
							
						}
						else{
							
							extchangeOffer = agent.opponentRejected(actions.Reject, curTurn, keepGoFind);
						}

							if (!actions.hasOwnProperty('Reject')){
								doIt = false;
							}
							if (actions.hasOwnProperty('Offer') || actions.hasOwnProperty('Append') || actions.hasOwnProperty('Accept')){
								doIt = false;
							}
							if(doIt){
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
												socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
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
								else if(!(actions.hasOwnProperty('Offer') || actions.hasOwnProperty('Append') || actions.hasOwnProperty('Accept'))){
									agent.wait = true;
									socket.emit('message', "Just a minute, I need to think a bit.");
									return;
								}

								offerSomething = false;
								somethingHappend = true;
							}
						//},waitingRespondTime);
					}
				}
				if (currActions.hasOwnProperty('Query') && ((!currActions.hasOwnProperty('Accept')) && (!currActions.hasOwnProperty('Offer')) && (!currActions.hasOwnProperty('Reject')))){
					var actions = currActions;
					doIt = false;
					var Query = actions.Query;
					if (typeof(actions.Query) != "string"){
						Query = actions.Query[0];
					}
					switch (Query) {
						case "bid":{
								myLastBid = agent.pickBid(curTurn);
								if (myLastBid){
									if (myLastBid != "done"){
										socket.emit('negoactions', [{'Offer' :myLastBid}]);
										socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
									}
									else{
										socket.emit('message', "I guess we discuss everything and we can sign the agreement");
									}
								}
								else{
									socket.emit('message', "Can you make a counter offer?");
								}
								somethingHappend = true;

							break;
						}
						case "issues":{
								myLastBid = agent.pickIssueForYou(curTurn);
								console.log('  QUERY issues');
								somethingHappend = true;
							break;
						}
						case "compromise":{
							compromise = true;
								var comp = agent.tryToCompromise();
								if (comp != undefined){
									myLastBid = comp;
									socket.emit('negoactions', [{'Offer' :myLastBid}]);
									socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
								}
								
								else{
									socket.emit('message', "What are you willing to compromise?");
									

								}
								somethingHappend = true;
								compromise = true;
							break;
						}
						case "accept":{
							break;
						}
						default:{
								myLastBid = agent.pickSpecificBidForYou(curTurn, Query);
								socket.emit('negoactions', [{'Offer' :myLastBid}]);
								socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
								somethingHappend = true;
							break;
						}

					}
				
				}

				if (currActions.hasOwnProperty('Accept')){ // the opponent accept the agent's offer
					var actions = currActions;
					if (myLastBid==null){ 
						console.error("What do you accept? myLastBid is null");
					}
					else{
						doIt = false;
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

				if (currActions.hasOwnProperty('Insist')){ // come as array and not as object - change it if it array do it else make it array. same in the accept
					var actions = currActions;
					if (oppLastBid==null){  //add the loop of the accept her too after I'll add the check of the arrays
							console.log('message', "What do you insist?");
					}
					else{
						doIt = false;
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

				if (currActions.hasOwnProperty('Append')){ // come as array and not as object - change it if it array do it else make it array. same in the accept
					var actions = currActions;
					if (oppLastBid==null){  //add the loop of the accept her too after I'll add the check of the arrays
							//socket.emit('message', "What do you appand?");
					}
					else{
						doIt = false;
						var issueName = actions.Append
						if (issueName == "previous"){
							util._extend(newOppBid, oppLastBid);
						}
					}
				}

				if (currActions.hasOwnProperty('Offer')){ // 'Offer in actions'
					var actions = currActions;
					doIt = false;
					util._extend(newOppBid, actions.Offer);
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
						socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
							if (accept == "done"){
								socket.emit('message', acceptnece +" We can sign the agreement now.");
								agreed = true;
								return;
							}
							else{
								if (accept){
									var send = "";
									for (issue in myLastBid){
										send+= issue + " - " + myLastBid[issue] + ". "
									}
									socket.emit('message', acceptnece + send );
									socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
									
									myLastBid = {};

									for(var i=0; i<accept.length; i++){
										if(accept[i].valueOf("Object")){
											for (val in (accept[i])){
												if(val == 'Offer')
													util._extend(myLastBid, accept[i][val]);
											}
										}
									}
									socket.emit('negoactions', accept);
									socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
								}
							}
							somethingHappend = true;
					} 
					else {  // partial accept and/or new offers
						offerSomething == true;
						var finishAll = false;
						agentReplyAction = agent.checkBid(newOppBid, curTurn);
						oppLastBid = clone(newOppBid);
							if (agentReplyAction){ 

								for(var i=0; i<agentReplyAction.length; i++){
									if(agentReplyAction[i].valueOf("Object")){
										for (val in (agentReplyAction[i])){
											if(val == "Offer"){
												myLastBid= clone(agentReplyAction[i][val]);
												socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
											}
											if(val == 'ChangeIssue'){
												util._extend(myLastBid, agentReplyAction[0]['Accept']);
												socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
											}
											if(val == 'StartNewIssue'){
													socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: oppLastBid, role: role});
												myLastBid = clone(oppLastBid);
											}
											if(val == 'currentAgreement'){
												socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: agentReplyAction[i][val], role: role});
												myLastBid = clone(oppLastBid);
												agentReplyAction.splice(i,1);
												i--;

											}
											if(val == 'done'){
												finishAll = true;
												agentReplyAction.splice(i,1);
												i--;

											}
										}
									}
								}
								socket.emit('negoactions', agentReplyAction);
								if(finishAll){
									setTimeout(function(){
										socket.emit('message', "I guess we discuss everything and we can sign the agreement");
									},2000)
	
								}
							}
							somethingHappend = true;
					
					}
				}
			},cuttWaitingRespondTime);
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
		console.log("bey bey! :) try to disconnect");
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

function checkIfDoubbleAction(obj1, obj2){
	var value = false;
	for(obj in obj2){
		if(obj1.hasOwnProperty(obj)){
			if(obj1[obj] == obj2[obj]){
				value = true;
			}
		}
	}
	return value;

}