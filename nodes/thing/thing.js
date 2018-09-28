const fs = require('fs');
const {promisify} = require('util');
const readFileAsync = promisify(fs.readFile);
var last_serialPort = null;
var requireFromString = require('require-from-string');
var host = require('os').hostname() + '-';
var counter = 0;
var board;
const http_thing_directory_url = 'http://mml.arces.unibo.it:3000/thing/';
const coap_thing_directory_url = 'coap://mml.arces.unibo.it:5683/thing/';
let thing_directory_url;
let client;

function wait (timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

var wotTypes = {
"sensor": {"sosa" : { "@id" : "http://www.w3.org/ns/sosa/Sensor"}},
"actuator": {"sosa" : { "@id" : "http://www.w3.org/ns/sosa/Actuator"}}
}

async function
load_thing(what) {
	try {
		var obj = await readFileAsync(what, 'utf8');
		obj = JSON.parse(obj);
		return obj;
	} catch(err) {
		console.log(err);
		exit(0);
	}
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


module.exports = function(RED) {
	function main(config) {

		let node = this;
		let WoT, srv;
		console.log(config);
		const realfunc = async function async(n) {

			let port = 8080;
			this.config = config;
			var node_wot = require(this.config.nwd+'/packages/core'); //node-wot directory
			var HttpServer = require(this.config.nwd+'/packages/binding-http').default;
			var HttpClient = require(this.config.nwd+'/packages/binding-http');
			var CoapServer = require(this.config.nwd+'/packages/binding-coap').default;
			var CoapClient = require(this.config.nwd+'/packages/binding-coap');
			this.serialPort = null;
			if(this.config.serialPort) {
				this.serialPort = this.config.serialPort;
			}

			this.pinNumber = this.config.pinNumber;
			RED.nodes.createNode(this,config);

			while(1) {
				try {
					this.log(config.wotType);
					srv =  new node_wot.Servient();
					if(this.config.wotProtocol === "all" || this.config.wotProtocol === "http") {
						srv.addServer(new HttpServer(port));
						srv.addClientFactory(new HttpClient.HttpClientFactory(port));
						thing_directory_url = http_thing_directory_url;
						client = srv.getClientFor('http');
					}
					if(this.config.wotProtocol === "all" || this.config.wotProtocol === "coap") {
						srv.addServer(new CoapServer(port+1));
						srv.addClientFactory(new CoapClient.CoapClientFactory(port+1));
						if(!thing_directory_url) {
							thing_directory_url = coap_thing_directory_url;
							client = srv.getClientFor('coap');
						}
					}
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
			if(this.config.remoteTam) {

				var td_url = this.config.remoteTam.split('/actions')[0];
				var tmp_thing = await getThing(this, td_url);
				var thing_handle = this.WoT.consume(tmp_thing);
				let payload = {};
				payload.application = this.config.remoteTam.split('?application=')[1];
				let tam = await thing_handle.actions.getThingApplication.invoke(payload);
				this.tam = requireFromString(tam, __dirname+'/thing/tmp');
			} else {
				this.tam = require(this.config.tam);
			}

			try {

				var obj = null;
				let ID;
				obj = await load_thing(this.config.tdt); //thing description template
				obj["name"] = this.config.name;
				ID = this.config.name;
				let tmp_type;
				let tmp_obj;
				if(this.config.wotType) {
					tmp_obj = JSON.parse(this.config.wotType);
					let key = Object.keys(tmp_obj)[0];
					tmp_type = tmp_obj[key]["@id"].substr(tmp_obj[key]["@id"].lastIndexOf('/') + 1);
					var str = tmp_obj[key]["@id"].substr(tmp_obj[key]["@id"].lastIndexOf('/') + 1) + '$';
					tmp_obj[key]["@id"] = tmp_obj[key]["@id"].replace( new RegExp(str), '' );
					obj["@context"].push(tmp_obj);
					obj["@type"].push(key+":"+tmp_type);
				} else {
					console.log(this.config);
					tmp_obj = wotTypes[this.config.wotTypeSelect];
					let key = Object.keys(tmp_obj)[0];
					tmp_type = tmp_obj[key]["@id"].substr(tmp_obj[key]["@id"].lastIndexOf('/') + 1);
					var str = tmp_obj[key]["@id"].substr(tmp_obj[key]["@id"].lastIndexOf('/') + 1) + '$';
					tmp_obj[key]["@id"] = tmp_obj[key]["@id"].replace( new RegExp(str), '' );
					obj["@context"].push(tmp_obj);
					obj["@type"].push(key+":"+tmp_type);

				}
				this.thing = this.WoT.produce(JSON.stringify(obj));
				this.board = board;
				this.thing = await this.tam.main(this, this.config); //thing application module
				board = this.board;
				let publish = {};
				publish.form = {};
				publish.form.href = thing_directory_url+ID;
				if(this.config.thingDirectoryUrl) {
					publish.form.href = this.config.thingDirectoryUrl+ID;
				}
				publish.content = {};
				let TD = await this.thing.getThingDescription();
				TD = JSON.parse(TD);

				//FIXME manually remove this context since it seems to be wrong JSON-ld
				var index = TD["@context"].indexOf("http://www.w3.org/ns/td");

				TD["@context"].splice(index, 1);
				publish.content.body = Buffer.from(JSON.stringify(TD));
				publish.content.contentType = "application/json";
				publish.content.mediaType= "application/json";
				await client.invokeResource(publish.form, publish.content);


				this.thing.expose();

			} catch (e) {
				console.log("Error");
				console.log(e);
			}
		}
		realfunc.apply(this, [config]);



		node.on('close', function() {
			this.srv.shutdown();
			this.warn('closing servient');
		});
		node.on('input', async function(msg) {
			delete msg;
			return;

		});
	}
	RED.nodes.registerType("thing", main);
}

