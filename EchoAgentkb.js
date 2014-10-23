
/**
 * Other : Osnat Drain - osnatairy@gmail.com
 * Help with everything : Erel Segal Halevi - erelsgl@gmail.com
 * Initialize a new agent. 
 * @param socket - a socket.io client that this agent will use to connect to the negotiation server.
 */

var util = require('util');
exports.Agent = function (name, agent, socket, role, type,counry) {
  	var role = role;
	var agent = agent;
	var userid = this.userid = name + new Date().toISOString();
	var myLastBid;
	var oppLastBid;
	var curSratus;
	var gameid = gameid;
	var curTurn = 0;
	var agreed = false;
	var newType = type;

	socket.on('connect', function () { 
		console.log("Hi, I am "+userid+", and I just connected to the negotiation server!" + type );
		
	});

	socket.on('status',function (status) { 
		if (status.value == "0:00"){
	
		}
		curStatus = status;
	});

	socket.on("EndGame", function(){
		console.log("END-GAME")
   		socket.emit("giveMeMyReservationUtility");
   		socket.disconnect();
    });


	socket.on('EndTurn', function (turn) { 
		if (curTurn !== turn){
			setTimeout(function(){
				if(agreed){
					socket.emit('message', "You can sign the agreement.");
				}
				else{
					if(type == "honor" && curTurn == 1){
						socket.emit('message', "It is an honor to meet you. I hope work together to to have a fair agreement and to get your trust that I can conform to this Job.");
						setTimeout(function(){
							myLastBid = agent.pickBid(turn);
							socket.emit('negoactions', [{'Offer' :myLastBid}]);
							socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
						},4000);
					}
					else{

						myLastBid = agent.pickBid(turn);
						socket.emit('negoactions', [{'Offer' :myLastBid}]);
						socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
					}
				}
			},5000);
			curTurn = turn;
			console.log("A turn has ended: "+turn);
		}
	});

	socket.on('announcement', function (announcement) { 
		console.log("Something happened: "+JSON.stringify(announcement));

	});


	socket.on('negoactions', function (actions) { 
		var action;
		var newOppBid = {};
		if (actions.hasOwnProperty('Reject')){ // the opponent reject the agent's offer
			if (myLastBid==null){ 
					socket.emit('message', "What do you reject?");
			}
			agent.opponentRejected(myLastBid, curTurn);
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
							console.error("How can you accept my offer about '"+issueName[i]+"'. when I even haven't offered it yet?")
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
			agreed = false;
		}

		if (actions.hasOwnProperty('Greet')){ 
			socket.emit('negoactions', [{'Greet': true}]);
		}

		if (Object.keys(newOppBid).length==0) {  // only greet
			return;
		} else {
			var equal = true;
			for (issue in myLastBid){
				if (myLastBid[issue] != newOppBid[issue])
					equal = false;
			}
			if (equal) { // full accept
				agent.opponentAccepted(myLastBid, curTurn);
				agreed = true;
				socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: myLastBid, role: role});
				socket.emit('message', "I'm happy that you accept. You can sign the agreement.");
			} 
			else {  // partial accept and/or new offers
				agentReplyAction = agent.checkBid(newOppBid, curTurn);
				oppLastBid = newOppBid; 
				if (agentReplyAction.hasOwnProperty('Accept')){ //the agent accept the opponent's offer
					socket.emit('enterAgentBidToMapRoleToMapIssueToValue', {bid: oppLastBid, role: role});
					agreed = true;
				}
				socket.emit('negoactions', [agentReplyAction]);
			}
		}
	});
	
	socket.on('sign', function (data) { //the agent allwas sign after the opponent so we won't get to infinit loop.
		var proposer = data.id + (data.you? " (You)": "");

		//check if the agreement is the same as the one in my last bid or his last bid with flag = true.
		if(newType == "honor"){
			socket.emit('message', " I want to thank you about your help, transparency, modesty and patience. I of course I will be committed with you. ");
			//check if the agreement is the same as the one in my last bid or his last bid with flag = true.
			setTimeout(function(){
				socket.emit('sign' ,data.agreement );
				socket.disconnect();
			},2000);
			
		}
		else{
			socket.emit('sign' ,data.agreement );
			socket.disconnect();
		}
	});

	socket.on('yourPartnerOpt-out', function (){
		console.log("yourPartnerOpt-out");
		socket.emit('opt-out', true);
		socket.disconnect();
	});

	socket.on("EndGame", function(){
		socket.emit("giveMeMyReservationUtility");
		socket.disconnect();
	});
	
	socket.on('Disconnect', function (status) { 
		console.log("bey bey! :)");
	});
}

