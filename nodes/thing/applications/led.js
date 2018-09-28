const NAME_PROPERTY_ISON = "isOn";
const NAME_ACTION_TURNON = "turnOn";
const NAME_ACTION_TURNOFF = "turnOff";
const NAME_ACTION_TOGGLE = "toggle";
var five = require("johnny-five");
var led = null;


exports.main = async function(node, config) {

	var serialPort = config.serialPort;
	var pinNumber = config.pinNumber;
	var thing = node.thing;
	var board = node.board;
	thing.addProperty(
		NAME_PROPERTY_ISON,
	{
		schema : '{ "type": "boolean"}',
		observable : true,
		writeable : true
	}, false)

	thing.addAction(NAME_ACTION_TURNON);

	thing.addAction(NAME_ACTION_TURNOFF);

	thing.addAction(NAME_ACTION_TOGGLE);


	thing.setActionHandler(
		NAME_ACTION_TURNON,
		(parameters) => {
			console.log("Turning on");
			thing.properties[NAME_PROPERTY_ISON].write(true);
			led.on();
		}
	);
	thing.setActionHandler(
		NAME_ACTION_TURNOFF,
		(parameters) => {
			console.log("Turning off");
			thing.properties[NAME_PROPERTY_ISON].write(false);
			led.off();
		}
	);

	thing.setActionHandler(
		NAME_ACTION_TOGGLE,
		(parameters) => {
			console.log("Toggle");
			return thing.properties[NAME_PROPERTY_ISON].read().then(function(is_on){
				let value = true;
				led.on();
				if(is_on) {
					value = false;
					led.off();
				}
				thing.properties[NAME_PROPERTY_ISON].write(value);
			});
		}
	);

	if(board) {
		led = new five.Led(pinNumber);
		return thing;
	} else {
		if(serialPort) {
			board = new five.Board( {
				port: serialPort,
				repl: false

			});
		} else {
			board = new five.Board( {
				repl: false
			});

		}
		node.board = board;
		board.on("ready", function() {
			led = new five.Led(pinNumber);
		});
		return thing;
	}

};
