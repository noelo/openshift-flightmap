var sys = require('sys');
var net = require('net');
var mqtt = require('mqtt');
var static = require('node-static');
var sbs1 = require('sbs1');
var HashMap = require('hashmap').HashMap;
var tls = require("tls");


var FlightMap = new HashMap();

// var io  = require('socket.io').listen(5000);

var MQTTOptions = {
  username: 'admin',
  password: 'admin123456',
  sniHost: 'test123',
  rejectUnauthorized : false,
  certPath: 'server.crt'
};



//Monkey patch MQTT.js code to facilitate SNI for SSL
// mqtt.createSecureClient = function(port, host, opts) {
//   var builder, mqttClient, tls_opts = {};

//   if ('object' === typeof port) {
//     opts = port;
//     port = defaultPort;
//     host = defaultHost;
//   } else if ('object' === typeof host) {
//     opts = host;
//     host = defaultHost;
//   } else if ('object' !== typeof opts) {
//     opts = {};
//   }

//   if (opts && opts.clean === false && !opts.clientId) {
//     throw new Error("Missing clientId for unclean clients");
//   }

//   if (opts.keyPath && opts.certPath) {
//     tls_opts.key = fs.readFileSync(opts.keyPath);
//     tls_opts.cert = fs.readFileSync(opts.certPath);
//   }
//   tls_opts.ca = [];
//   if (opts.ca) {
//     for (var i = 0;i<opts.ca.length;i++) {
//       tls_opts.ca[i] = fs.readFileSync(opts.ca[i]);
//     }
//   }
//   tls_opts.rejectUnauthorized = opts.rejectUnauthorized || false;

//   tls_opts.port = port
//   tls_opts.host = host

//   //Check for SNI settings
//   if (opts.sniHost){
//     tls_opts.servername = opts.SNIHost;
//   }

//   builder = function() {
//     var tls_client = tls.connect(tls_opts)

//     tls_client.on('secureConnect', function() {
//       if (tls_opts.rejectUnauthorized && !tls_client.authorized) {
//         tls_client.emit('error', new Error('TLS not authorized'));
//       } else {
//         tls_client.removeListener('error', handleTLSerrors)
//       }
//     });

//     function handleTLSerrors(err) {
//       // How can I get verify this error is a tls error?
//       if (tls_opts.rejectUnauthorized) {
//         mqttClient.emit('error', err)
//       }

//       // close this connection to match the behaviour of net
//       // otherwise all we get is an error from the tls_client
//       // and close event doesn't fire. This is a work around
//       // to enable the reconnect code to work the same as with
//       // net.createConnection
//       tls_client.end();
//     }

//     tls_client.on('error', handleTLSerrors)

//     return tls_client;
//   };
//   mqttClient = new mqtt.MqttClient(builder, opts);

//   return mqttClient;
// };




//var client = mqtt.createSecureClient(1883, 'localhost',MQTTOptions);
var client = mqtt.createSecureClient(2306, 'amq2-noconnor.rhcloud.com',MQTTOptions);
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'


var file = new static.Server('./public'); 
require('http').createServer(function (request, response) {
  var url = request.url;
  console.log(url);
  
  if (url == '/'){
    request.url = 'gmap.html'
  }

  if(url == '/dump1090/data.json')
  {
    response.setHeader("Content-Type", "text/json");
    response.setHeader("Access-Control-Allow-Origin", "*");
    console.log(JSON.stringify(buildFlightDataArray()));
    response.end(JSON.stringify(buildFlightDataArray()));
  }
  else {
    file.serve(request, response);
  }
  request.addListener('end', function () {
  }).resume();
}).listen(server_port,server_ip_address);

client.subscribe('/topic/flightinfo/au',function(){
	console.log('Subscribed....')
});

//Websockets to be done later
// io.sockets.on('connection', function (socket) {
//   socket.on('subscribe', function (data) {
//     console.log('Subscribing to '+data.topic);
//     client.subscribe(data.topic);
//   });
// });

// client.addListener('mqttData', function(topic, payload){
//   sys.puts(topic+'='+payload);
//   io.sockets.emit('mqtt',{'topic':String(topic),
//     'payload':String(payload)});
// });

client.on('message',function(topic,message){
  var msg = sbs1.parseSbs1Message(message);

  if (msg.message_type === sbs1.MessageType.TRANSMISSION){
    var curr = FlightMap.get(msg.hex_ident)
    switch(msg.transmission_type){

      case sbs1.TransmissionType.ES_IDENT_AND_CATEGORY:
      if (curr === undefined){
        var tmp = {};
        tmp.callsign = msg.callsign;
        tmp.hex_ident = msg.hex_ident;
        tmp.updatetimestamp = Date.now();
        tmp.messagecount=0;
        FlightMap.set(msg.hex_ident,tmp);
      }else{
        curr.callsign = msg.callsign; 
        curr.messagecount++;
        curr.updatetimestamp = Date.now();
        FlightMap.set(msg.hex_ident,curr);
      }
      break;

      case sbs1.TransmissionType.ES_AIRBORNE_POS:
      if (curr === undefined){
        var tmp = {};
        tmp.callsign = 'Unknown';
        tmp.hex_ident = msg.hex_ident;
        tmp.altitude = msg.altitude;
        tmp.lat = msg.lat;
        tmp.lon = msg.lon;
        tmp.messagecount=0;
        FlightMap.set(msg.hex_ident,tmp);

      }else{
        curr.hex_ident = msg.hex_ident;
        curr.altitude = msg.altitude;
        curr.lat = msg.lat;
        curr.lon = msg.lon;
        curr.messagecount++;
        curr.updatetimestamp = Date.now();
        FlightMap.set(msg.hex_ident,curr);
      }
      break;

      case sbs1.TransmissionType.ES_SURFACE_POS:
      if (curr === undefined){
        var tmp = {};
        tmp.callsign = 'Unknown';
        tmp.hex_ident = msg.hex_ident;
        tmp.altitude = msg.altitude;
        tmp.lat = msg.lat;
        tmp.lon = msg.lon;
        tmp.track = msg.track;
        tmp.speed = msg.ground_speed;
        tmp.messagecount=0;
        FlightMap.set(msg.hex_ident,tmp);
      }else{
        curr.hex_ident = msg.hex_ident;
        curr.altitude = msg.altitude;
        curr.lat = msg.lat;
        curr.lon = msg.lon;
        curr.track = msg.track;
        curr.speed = msg.ground_speed;
        curr.messagecount++;
        curr.updatetimestamp = Date.now();
        FlightMap.set(msg.hex_ident,curr);
      }
      break;

      case sbs1.TransmissionType.ES_AIRBORNE_VEL:
      if (curr === undefined){
        var tmp = {};
        tmp.callsign = 'Unknown';
        tmp.hex_ident = msg.hex_ident;
        tmp.vert_rate = msg.vertical_rate;
        tmp.track = msg.track;
        tmp.speed = msg.ground_speed;
        tmp.updatetimestamp = Date.now();
        tmp.messagecount=0;
        FlightMap.set(msg.hex_ident,tmp);
      }else{
        curr.hex_ident = msg.hex_ident;
        curr.vert_rate = msg.vertical_rate;
        curr.track = msg.track;
        curr.speed = msg.ground_speed;
        curr.updatetimestamp = Date.now();
        curr.messagecount++;
        FlightMap.set(msg.hex_ident,curr);
      }
      break;

      case sbs1.TransmissionType.SURVEILLANCE_ID:
      if (curr === undefined){
        var tmp = {};
        tmp.hex_ident = msg.hex_ident;
        tmp.callsign = 'Unknown';
        tmp.squawk = msg.squawk;
        tmp.messagecount=0;
        FlightMap.set(msg.hex_ident,tmp);
      }else{
        curr.hex_ident = msg.hex_ident;
        curr.squawk = msg.squawk;
        curr.timestamp = Date.now();
        curr.messagecount++;
        curr.updatetimestamp = Date.now();
        FlightMap.set(msg.hex_ident,curr);
      }
      break;


      default:
      status_msg =''
    }
  }});

client.on('connect',function(){
  console.log('connected ....')
});

setInterval(function() { console.log("----------------------------------");console.log(JSON.stringify(FlightMap));console.log("=================================="); }, 20000);

setInterval(function() { cleanFlightDataArray(); }, 120000);


function buildFlightDataArray(){
  var results=[];
  FlightMap.forEach(function(value, key) {
    // Count the number of properties to remove incomplete data
    if (Object.keys(value).length >= 12){
      var x={};
      x.hex = value.hex_ident;
      x.squawk = value.squawk;
      x.flight = value.callsign;
      x.lat = value.lat;
      x.lon = value.lon;
      x.validposition = 1;
      x.altitude = value.altitude;
      x.vert_rate = value.vert_rate;
      x.track = value.track;
      x.validtrack = 1;
      x.speed = value.speed;
      x.messages = value.messagecount;
      //Indicate to UI to remove stuff that hasn't been updated in a minute
      if ((Date.now() - value.updatetimestamp )>60000){
        x.seen = 60;
      }else{
        x.seen = 1;
      }
      results.push(x);
    }
  });
  return results;
}


function cleanFlightDataArray(){
  var results=[];
  FlightMap.forEach(function(value, key) {

    if ((Date.now() - value.updatetimestamp )>90000){
      FlightMap.remove(key);
    }
  }
);}


