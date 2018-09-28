const NAME_ACTION_GET = "getThingApplication";
const {promisify} = require('util');
var fs = require('fs');
const readFileAsync = promisify(fs.readFile);
const dir = '/home/luke/.node-red/node_modules/thing/applications/';

var applications = {
	"led": dir+"led",
	"sensor": dir+"sensor"
}


async function
load_app(what) {
	try {
		var obj = await readFileAsync(applications[what]+'.js', 'utf8');
		return obj;
	} catch(err) {
		console.log(err);
		return '';
	}
}




exports.main = async function (node, config) {

	var thing = node.thing;
	thing.addAction(NAME_ACTION_GET);

	thing.setActionHandler(
		NAME_ACTION_GET,
		async (parameters) => {
			console.log("APPLICATION REQUESTED");
			var application = parameters.application;
			application = await load_app(application);
			return application;
		}
	);
	return thing;

};
