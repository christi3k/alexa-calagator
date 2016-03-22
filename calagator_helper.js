var moment = require('moment-timezone');
var _ = require('lodash');
var rp = require('request-promise');
var CGATOR_EVENTS = 'http://calagator.org/events.json';


var calagator = {};

calagator.get_events = function(response,date) {
  console.log('requesting date: ' + date);

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
      response.say('Calagator has ' + events.length + ' events.');
      _.forEach(events, function(anEvent) {
        response.say("<p><s>" + anEvent.title + " <break strength='medium'/> at "+anEvent.venue.title+" <break strength='medium'/> starting at "+moment(anEvent.start_time).tz('America/Los_Angeles').format('ha')+".</s></p>");
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
