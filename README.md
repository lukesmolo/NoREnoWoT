# NoREno WoT: Node-RED nodes for Web of Things
>NoRenoWot is a set of nodes made for Node-RED as a proof-of-concept of the WoTStore. WotStore is a result from a scientific research that led to a publication in the international conference:

>L. Sciullo, C. Aguzzi , M. Di Felice, T. Salmon Cinotti, "WoT Store: Enabling Things and Applications
Discovery for the W3C Web of Things", to appear on Proceedings of IEEE [CCNC 2019](http://ccnc2019.ieee-ccnc.org/), Las Vegas,
NV, January 11-14, 2019.


## Paper abstract
The Web of Things (WoT) architecture recently proposed by the W3C working group constitutes a promising approach to handle interoperability issues among heterogeneous devices and platforms, by semantically describing interfaces and interaction patterns among the Things. One of the main advantage of the W3C architecture is the possibility to decouple the description of the Things' behavior from their implementation and communication strategies, hence greatly simplifying the deployment of novel applications and services on top of it. Starting from such state-of-art, and envisioning a Web of seamlessly interacting W3C Things, this paper focuses on the next steps, i.e.: how to effectively support the discovery of Things? and: how to ease the distribution of applications running on Things? We answer to both the questions above through the proposal of the *WoT Store*, a novel software platform supporting the distribution, discovery and installation of applications for the W3C WoT. The *WoT Store* allows users to perform semantic discovery of the available Things, to search for compatible applications available on the market, and to install them over the target devices, all within the same framework. We describe the platform architecture and its proof-of-concept implementation, providing two alternative interfaces to interact with our tool: a Web portal, and new modules developed for the popular Node-RED platform. Finally, we discuss two realistic use-cases of the *WoT Store* for industrial IoT and home automation systems, remarking the advantages of our solution in terms of deployment costs and interoperability support.




## How it works

NoRenoWoT contains three nodes:
1. **Thing**: it corresponds to the instantiation of a W3C Web Thing, deployed directly on the device hosting the entity. It offers the possibility to configure several parameters, like the name, semantic type, the Directory Service (DS) where it will be published and the TA it will run, either as a local file or as a URI found on the WotStore . In case no application is provided, a default one is executed, including a basic upload action which allows changing the application code at runtime.
2. **Thing Discovery**: it is the implementation of the DS previously mentioned. In particular, it requires the URI of the DS, and the semantic type of the Things to search for. It optionally supports a push notification mechanism,
in order to inform the user each time a new Thing has registered to the DS.
3. **Thing Consumer**: it simply consumes a TD coming from the ThingDiscovery node, i.e., it turns the semantic description of a Thing into a software object.

After the instantiation, a *thing* is publicized on a *thing Directory*, thanks to the use of [SEPAThingDir](https://github.com/relu91/SEPAThingDir).
The *thingDiscovery* node is in charge to discover and collect all the Thing Descriptions of the @type it is subscribed to. The *thingConsumer* simply turns the TD obtained by the previous node into a software object, i.e., a *Thing*.


You can simply instantiate some things by properly configuring the *Thing node* or you can try to entirely reproduce the next example.
<br>
<img src="/pics/nodered.png " width="40%">
<br>

The previous image shows an example where a led on an Arduino is turned on if the value coming from a sensor exceeds a predefined threshold. The application logic is a simple *function* node of Node-RED, running a code like the following one:
```javascript
let val = msg.payload.val;
msg.payload = {};
msg.payload.targetID = "led";
if(val < THRESHOLD) {
    msg.payload.invokeAction = "turnOn"
} else {
    msg.payload.invokeAction = "turnOff"
}
return msg;
```


## Usage
You need to have [Node-RED](https://nodered.org/)  and [thingweb.node-wot](https://github.com/eclipse/thingweb.node-wot) installed on your machine. 

Clone this repository:
```
$ git clone git@github.com:lukesmolo/norenowot.git
```


Then go to the Node-RED directory and install the norenowot nodes. For example, if the Node-RED directory is *~/.node-red* and the norenowot directory is *~/dev/norenowot*, just type the following:

```javascript
cd ~/.node-red
npm install ~/dev/norenowot/nodes/*

```


## License
NoREnoWoT is released under [Eclipse Public License v. 2.0](http://www.eclipse.org/legal/epl-2.0) .
