var _ = require('lodash');
var rp = require('request-promise');
var CGATOR_EVENTS = 'http://calagator.org/events.json';


var calagator = {};

calagator.get_events = function(response,date) {
  console.log('requesting date: ' + date);
  if (date == "") { date = '2016-03-24'; }

  var options = {
    uri: CGATOR_EVENTS,
    qs: {
      'date[start]': date,
      'date[end]': date
    },
    json: true
  };

  rp(options)
    .then(function (events) {
      console.log('Calagator has %d events', events.length);
      //var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
//compiled({ 'users': ['fred', 'barney'] });
      //console.log(events);
      //var compiled = _.template('<% _.forEach(events, function(event){ %><%- event.title %><% }); %>');
      //console.log(compiled(events));
      response.say('Calagator has ' + events.length + ' events.');
      _.forEach(events, function(value) {
        //console.log(value.title);
        response.say(value.title);
      });
      response.send();
    })
    .catch(function () {
      console.log('API call failed');
      response.say("I'm sorry, Calagator is unavailable at the moment.");
      response.send();
    });
}

module.exports = calagator;
