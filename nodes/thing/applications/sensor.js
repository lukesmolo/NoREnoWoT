const NAME_PROPERTY_VAL = "value";
const NAME_ACTION_READ = "readValue";
var five = require("johnny-five");
var sensor = null;



exports.main = async function (node, config) {
	var serialPort = config.serialPort;
	var pinNumber = config.pinNumber;
	var thing = node.thing;
	var board = node.board;
	thing.addProperty(
		NAME_PROPERTY_VAL,
		{
		schema : '{ "type": "integer"}',
		value : true,
		observable : true,
		writeable : true
	}, 0)

	thing.addAction(NAME_ACTION_READ);



	if(board) {
		sensor =  new five.Sensor({pin: pinNumber,
			freq: 500
		});
			sensor.on("data", function() {
				let val = this.scaleTo(0, 10);
				thing.properties[NAME_PROPERTY_VAL].write(val);
			});
		board.on("ready", function() {
			sensor =  new five.Sensor({pin: pinNumber,
				freq: 500
			});
			sensor.on("data", async function() {
				let val = this.scaleTo(0, 10);
				let old_val = await thing.properties[NAME_PROPERTY_VAL].read();
				if(val != old_val) {
					thing.properties[NAME_PROPERTY_VAL].write(val);
					msg = {};
					msg.payload = {};
					msg.payload.val = val;
					msg.from = thing.name;
					node.send(msg);
				}
			});
			return thing;
		});
		return thing;
	} else {
		if(serialPort) {
			board = new five.Board( {
				port: serialPort,
				repl: false
			});
		} else {
			board = new five.Board( {repl: false});

		}
		node.board = board;

		board.on("ready", function() {
			sensor =  new five.Sensor({pin: pinNumber,
				freq: 500
			});
			sensor.on("data", async function() {
				let val = this.scaleTo(0, 10);
				let old_val = await thing.properties[NAME_PROPERTY_VAL].read();
				if(val != old_val) {
					thing.properties[NAME_PROPERTY_VAL].write(val);
					msg = {};
					msg.payload = {};
					msg.payload.val = val;
					msg.from = thing.name;
					node.send(msg);
				}
			});
			return thing;
		});
		return thing;
	}



};
