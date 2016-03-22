var moment = require('moment-timezone');
var _ = require('lodash');
var rp = require('request-promise');
var CGATOR_EVENTS = 'http://calagator.org/events.json';
var CGATOR_SEARCH = 'http://calagator.org/events/search.json';
//order=date&query=women+in+tech&current=1

var calagator = {};

calagator.get_events = function(request,response) {
  var date = request.slot('Date');
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

/*
 * needs to take a date string as provided by amazon and return a date range
 * to pass to Calagator API 
 */
calagator.prepare_date_range = function(date) {
  var date = '2016-03-22';
  /* date possibilities:
    “today”: 2015-11-24
    “tomorrow”: 2015-11-25
    “november twenty-fifth”: 2015-11-25
    “next monday”: 2015-11-30
    “this week”: 2015-W48
    “next week”: 2015-W49
    “this weekend”: 2015-W48-WE
    “this month”: 2015-11
    “next year”: 2016
    “this decade”: 201X
   */ 

  //fyi: If you want to create a copy and manipulate it, you should use moment#clone before manipulating the moment. More info on cloning.

  var dateTypes = [
    { dateType:"Day",
      regex:/\d{4}-\d{2}-\d{2}/,
      transform:function(date){ 
        return [date,date];
      }},
    { dateType:"Week" ,
      regex:/\d{4}-W\d{2}(?!-WE)/,
      transform:function(date){ 
        return [moment(date,'YYYY-WW').startOf('isoWeek').format('YYYY-MM-DD'), moment(date,'YYYY-WW').endOf('isoWeek').format('YYYY-MM-DD')];
      }},
    { dateType:"Weekend",
      regex:/\d{4}-W\d{2}-WE/,
      transform:function(date){ 
        if(match = date.match(/\d{4}-W\d{1,2}/)){
          date = match[0];
        }
        return [moment(date,'YYYY-WW').endOf('isoWeek').subtract(1,'days').format('YYYY-MM-DD'),moment(date,'YYYY-WW').endOf('isoWeek').format('YYYY-MM-DD')];
      }},
    { dateType:"Month",
      regex:/\d{4}-\d{2}(?!-\d{1,2})/,
      transform:function(date){ 
        return [moment(date).startOf('month','YYYY-MM').format('YYYY-MM-DD'), moment(date, 'YYYY-MM').endOf('month').format('YYYY-MM-DD')];
      }},
    { dateType:"Year",
      regex:/\d{4}(?!-W*\d{1,2})/,
      transform:function(date){ 
        return [moment(date,'YYYY').startOf('year').format('YYYY-MM-DD'), moment(date,'YYYY').endOf('year').format('YYYY-MM-DD')];
      }},
    { dateType:"Decade",
      regex:/\d{3}X/,
      transform:function(date){ 
        // get decade
        match = date.match(/\d{3}(?=X)/);
        var start = match[0] + 0;
        var end = match[0] + 9;
        return [moment(start,'YYYY').startOf('year').format('YYYY-MM-DD'), moment(end,'YYYY').endOf('year').format('YYYY-MM-DD')];
      }}
  ];

  var date = '201X';

  var dateRange = {};

  for (var i = 0; i < dateTypes.length; i++) {
    console.log('loop: ' + i);
    if(date.match(dateTypes[i].regex)){
      dateRange.type = dateTypes[i].dateType;
      dateRange.range = dateTypes[i].transform(date);
      break;
    }
  }

  console.log(dateRange);
}
module.exports = calagator;
