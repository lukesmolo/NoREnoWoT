const node_wot = require('/home/luke/documents/wot/node-wot/packages/core');
const HttpServer = require('/home/luke/documents/wot/node-wot/packages/binding-http').default;
var HttpClient = require('/home/luke/documents/wot/node-wot/packages/binding-http');
const CoapServer = require('/home/luke/documents/wot/node-wot/packages/binding-coap').default;
const CoapClient = require('/home/luke/documents/wot/node-wot/packages/binding-coap');
const WebSocket = require('ws');

const thing_directory_url = 'ws://mml.arces.unibo.it:3001';


var wotTypes = {
"sensor" : { "@id" : "http://www.w3.org/ns/sosa/Sensor"},
"actuator" : { "@id" : "http://www.w3.org/ns/sosa/Actuator"}
}

function wait (timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

async function
getThing(node) {
	const MAX_RETRIES = 3
	for (let i = 0; i <= MAX_RETRIES; i++) {
		try {
			let res =  await node.WoT.fetch(node.domain+node.config.name);
			if(res !== "Not Found") {
				return res;
			} else {
				throw ("error");
			}
		} catch(err) {
				const timeout = Math.pow(2, i)*1000
				console.log('Waiting', timeout, 'ms')
				await wait(timeout)
				console.log('Retrying', err.message, i)
		}
	}
}


module.exports = function(RED) {
	function main(config) {

		let node = this;

		const realfunc = async function async(n) {

			this.config = config;
			if(this.config.thingDirectoryUrl) {
				this.ws = new WebSocket(this.config.thingDirectoryUrl);
			} else {
				try {
					this.ws = new WebSocket(thing_directory_url);
				} catch(err) {
					console.log(err);
				}
			}
			RED.nodes.createNode(this,config);

		}

		realfunc.apply(this, [config]);

		node.ws.on('open', function open() {
			var req = {};

			if(node.config.subscribeType) {
				req.type = this.config.subscribeType;
			} else {
				req.type = wotTypes[node.config.wotType]["@id"];
			}

			node.ws.send(JSON.stringify(req));
		});


		node.on('close', function() {
			this.warn('closing servient');
		});

		node.ws.on('message', function incoming(data) {
			console.log(msg);
			var msg = {};
			msg.payload = data;
			node.send(msg);
		});
	}
	RED.nodes.registerType("thingDiscovery", main);
}

