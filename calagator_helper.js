var moment = require('moment-timezone');
var _ = require('lodash');
var rp = require('request-promise');
var CGATOR_EVENTS = 'http://calagator.org/events.json';
var CGATOR_SEARCH = 'http://calagator.org/events/search.json';
//order=date&query=women+in+tech&current=1

var calagator = {};

calagator.get_events = function(request,response) {
  var date = request.slot('Date');
  var query = request.slot('Query');
  //console.log('date: ' + date);
  //console.log('query: ' + query);

  // if a date isn't provided, assume today
  if (!date){
    date = moment().tz('America/Los_Angeles').format('YYYY-MM-DD');
  }

  console.log('requesting date: ' + date);
  var dateRange = calagator.prepare_date_range(date);
  //console.log(dateRange);

  var options = {
    json: true
  };

  // if they've provided a query phrase, use events/search url
  // and will have to do date filtering server-side, after api results
  if(query){
    options.uri = CGATOR_SEARCH;
    options.qs = {
      'order': 'date',
      'query':query,
      'current':1
    };
  } else {
    options.uri = CGATOR_EVENTS;
    options.qs = {
      'date[start]': dateRange.range[0],
      'date[end]': dateRange.range[1]
    };
  }
  //console.log(options);

  rp(options)
    .then(function (events) {
      // TODO: move processing of speech output to it's own function
      //console.log('events found: ' + events.length);
      events = _.orderBy(events,['start_time']);
      console.log('event count: ' + events.length);
      events = _.filter(events, function(o) { 
        return !moment(o.start_time,moment.ISO_8601).tz('America/Los_Angeles').isAfter(moment(dateRange.range[1]).tz('America/Los_Angeles').endOf('day')) && moment(o.start_time,moment.ISO_8601).tz('America/Los_Angeles').isSameOrAfter(moment(dateRange.range[0]).tz('America/Los_Angeles').startOf('day')); 
      });
      console.log('event count after filter: ' + events.length);
      response.say('Calagator has ' + events.length + ' events.');
      _.forEach(events, function(anEvent) {
        // TODO: move dateFormat to dateRange data structure
        // TODO: add context here so date is more explicit if it's further in future
        if(dateRange.dateType && dateRange.dateType =='Day') {
          var dateFormat = 'ha';
        } else if (dateRange.dateType =='Month'){
          var dateFormat = 'ha dddd MMMM Do';
        } else {
          var dateFormat = 'ha dddd MMMM Do';
          //var dateFormat = 'ha dddd';
        }
        response.say("<p>");
        response.say("<s>");
          var title = anEvent.title.replace(/&/, 'and');
          title = title.replace(/-/,'');
        response.say(title + " <break strength='medium' /> starting at "+moment(anEvent.start_time).tz('America/Los_Angeles').format(dateFormat));
        if(anEvent.venue_id){
          var venue = anEvent.venue.title.replace(/&/, 'and');
          venue = venue.replace(/-/,'');
          response.say("<break strength='medium' /> at "+venue);
          //response.say("<break strength='medium' /> at "+anEvent.venue.title);
        }
        response.say("</s>");
        response.say("</p>");
      });
      response.send();
    })
    .catch(function (err) {
      console.log(err);
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

  // TODO: move def of this data structure outside of this function
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

  var dateRange = {};

  for (var i = 0; i < dateTypes.length; i++) {
    if(date.match(dateTypes[i].regex)){
      dateRange.type = dateTypes[i].dateType;
      dateRange.range = dateTypes[i].transform(date);
      break;
    }
  }

  return dateRange;
}
module.exports = calagator;
