const node_wot = require('/home/luke/documents/wot/node-wot/packages/core');
const HttpServer = require('/home/luke/documents/wot/node-wot/packages/binding-http').default;
var HttpClient = require('/home/luke/documents/wot/node-wot/packages/binding-http');
const CoapServer = require('/home/luke/documents/wot/node-wot/packages/binding-coap').default;
const CoapClient = require('/home/luke/documents/wot/node-wot/packages/binding-coap');


function wait (timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

async function
getThing(node, td_url) {
	const MAX_RETRIES = 3
	for (let i = 0; i <= MAX_RETRIES; i++) {
		try {
			let res =  await node.WoT.fetch(td_url);
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

async function
consumeThing(TD, node) {
	const MAX_RETRIES = 3
		try {
			let res =  await node.WoT.consume(TD);
			return res;
		} catch(err) {
			console.log(err);
			return null;
		}
}

module.exports = function(RED) {
	function main(config) {

		let node = this;
		let WoT, srv;
		let port = 8081;
		const realfunc = async function async(n) {

			this.config = config;
			this.things = {};
			RED.nodes.createNode(this,config);
			while(1) {
				try {
					srv =  new node_wot.Servient();
					srv.addClientFactory(new HttpClient.HttpClientFactory(port));
					srv.addClientFactory(new CoapClient.CoapClientFactory(port+1));
					WoT = await srv.start();
					this.srv = srv;
					this.WoT = WoT;
					break;
				} catch(err) {
					port += 2;
					console.log(err);
					console.log("trying with port: " + port);
				}
			}

		}
		realfunc.apply(this, [config]);
		node.on('close', function() {
			this.srv.shutdown();
			this.warn('closing servient');
		});
		node.on('input', async function(msg) {
			try {
				JSON.parse(msg.payload);
				msg.payload = JSON.parse(msg.payload);
			} catch (e) {
				console.log("already JSON");
			}
			try {

				if(msg.payload.added) {

					var td = JSON.stringify(msg.payload.added);
					var name;
						var tmp_thing = await consumeThing(td, this);
						var thing_handle = tmp_thing;
						this.things[thing_handle["id"]] = thing_handle;

					return;
				} else if(msg.payload.removed) {
					delete this.things[msg.payload.removed];
				}

				if(Object.keys(this.things).length < 1) { //if there are no things
					node.warn("No thing known");
					delete msg;
					return;
				}
				if(!('thing') in msg.payload) {
					node.warn("Request discarded, no thing target specified in payload");
					delete msg;
					return;

				}
				var thing_target_id = msg.payload.targetID;
				var thing;
				if(!thing_target_id || !this.things[thing_target_id]) {
					node.warn("Request discarded, the target "+thing_target_id+" was not found");
					delete msg;
					return;

				} else {
					thing = this.things[thing_target_id];
				}

				if('readProperty' in msg.payload) {
					let val = await thing.readProperty(msg.payload.readProperty);
					msg.payload = {};
					msg.payload.val = val;
					msg.from = thing.name;
				}

				if('invokeAction' in msg.payload) {
					await thing.invokeAction(msg.payload.invokeAction)
					delete msg;
					return;
				}


				if(msg && msg.from) {
					node.send(msg);
				}} catch(e) {
					console.log(e);
				}
		});

	}
	RED.nodes.registerType("thingConsumer", main);
}

