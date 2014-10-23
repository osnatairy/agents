// This is a manager for negotiation agents.
// It creates agents that connect, as socket.io clients, to our negotiation server. 
var path = require('path');
var socketio_client = require('socket.io-client');
var socketio_host = "localhost";
var socketio_settings;/* = {
	port: 4000, 
	'force new connection': true, 
	'sync disconnect on unload': true
};*/

var EchoAgent;
var async = require('async');
var genius = require('./genius');
var domains = {};
var country1;
var agentsList = {};

exports.AgentManager = function(country){
	switch(country){
		case "israel": socketio_settings = {
			port: 4004, 
			'force new connection': true, 
			'sync disconnect on unload': true
		}; break;
		case "egypt": socketio_settings = {
			port: 4002, 
			'force new connection': true, 
			'sync disconnect on unload': true
		}; break;
		case "usa": socketio_settings = {
			port: 4006, 
			'force new connection': true, 
			'sync disconnect on unload': true
		}; break;
		break;
	}
	domains['Job'] = new genius.Domain(path.join(__dirname,'domains/'+country,'JobCandiate','JobCanDomain.xml'));
	country1 = country;
	
}

var NegoChatAgent  = require('./type/NegoChatAgent');
var KBAgent  = require('./type/KBAgent');
var ChatAgent  = require('./type/ChatAgent');
var ChatAgentEgype  = require('./type/ChatAgent-egypt');
var NewAgent = require('./type/NewAgent');
var agent;

///////////////////////////////////////////////////////////////////////////////////////////////////

 //Create a new EchoAgent, and connect it to the given gametype in the given role.
//function launchNewEchoAgent (gametype, role, domain, agent) {
exports.launchNewEchoAgent = function(gametype, opponentRole, role, agentType, gameid, country,type) {
  
	var socket;
	if(agentsList.hasOwnProperty(gameid)){
		agent = agentsList[gameid].agent;
		socket = agentsList[gameid].socket;
		var Echoagent = agentsList[gameid].Echoagent;
	}
	else{
		async.series([
		    function(callback){
		        if (agentType == 'KBAgent'){
		        	EchoAgent = require('./EchoAgentkb');
		        	async.series([
					    function(callback){
					        agent = new KBAgent(domains['Job'], role, opponentRole, gameid,country1, type);
					        callback(null, 'one.one');
					    },
					    function(callback){
					        agent.initializeKBAgent();
					        callback(null, 'one.two');
					    },
					    function(callback){
					        agent.initializeBids(agent.domain);
					        agentsList[gameid] = {};
					        agentsList[gameid].agent = agent;
					        callback(null, 'one.three');
					    }
					],

					function(err, results){
					    console.log(results);
					});
		        }
				if (agentType == 'NegoChatAgent'){
					EchoAgent = require('./EchoAgent');
					async.series([
					    function(callback){
					        agent = new NegoChatAgent(domains['Job'], role, opponentRole, gameid,country1);
					        callback(null, 'two.one');
					    },
					    function(callback){
					        agent.initializeNegoChatAgent();
					        callback(null, 'two.two');
					    },
					    function(callback){
					        agent.initializeBids(agent.domain);
					        agentsList[gameid] = {};
					        agentsList[gameid].agent = agent;
					        callback(null, 'two.three');
					    }
					],
					// optional callback
					function(err, results){
					    console.log(results);
					});
				}
				if (agentType == 'ChatAgent'){
					EchoAgent = require('./EchoChatAgent');
					async.series([
					    function(callback){
					        agent = country =="egypt"? new ChatAgentEgype(domains['Job'], role, opponentRole, gameid,country1): new ChatAgent(domains['Job'], role, opponentRole, gameid,country1);
					        callback(null, 'two.one');
					    },
					    function(callback){
					        agent.initializeChatAgent();
					        callback(null, 'two.two');
					    },
					    function(callback){
					        agent.initializeBids(agent.domain);
					        agentsList[gameid] = {};
					        agentsList[gameid].agent = agent;
					        callback(null, 'two.three');
					    }
					],
					
					function(err, results){
					    console.log(results);
					});
				}

				if (agentType == 'NewAgent'){
					EchoAgent = require('./EchoAgentNew');
					async.series([
					    function(callback){
					        agent = new NewAgent(domains['Job'], role, opponentRole, gameid,country1);
					        callback(null, 'two.one');
					    },
					    function(callback){
					        agent.initializeNewAgent();
					        callback(null, 'two.two');
					    },
					    function(callback){
					        agent.initializeBids(agent.domain);
					        agentsList[gameid] = {};
					        agentsList[gameid].agent = agent;
					        callback(null, 'two.three');
					    }
					],
					
					function(err, results){
					    console.log(results);
					});
				}

				console.log('NUMBER ONE');
		        callback(null, 'one');
			},
			
		    function(callback){
		        socket = socketio_client.connect(socketio_host, socketio_settings);
				var Echoagent = new EchoAgent.Agent(agentType, agent, socket, role, type,country1);
				agentsList[gameid].socket = socket;
				agentsList[gameid].choagent = Echoagent;
				socket.emit("start_session", {
					userid: Echoagent.userid,
					gametype: gametype,
					role: role,
					country:country1,
				});
				console.log('start_session');
				console.log('NUMBER TWO');
		        callback(null, 'two');
		    }
		],



		function(err, results){
		    console.log(results);
		});
	}

		socket.on('error', function(){
				console.log('AN ERROR ECURED');
				socket.disconnect();
			});

			socket.on('end', function(){
				console.log('AN END ECURED');
				socket.disconnect();
			});

			socket.on('close', function(){
				console.log('AN CLOSE ECURED');
				socket.disconnect();
			});
			
} 
