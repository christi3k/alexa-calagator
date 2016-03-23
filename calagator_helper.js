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
  console.log('date: ' + date);
  console.log('query: ' + query);

  // if a date isn't provided, assume today
  if (!date){
    date = moment().tz('America/Los_Angeles').format('YYYY-MM-DD');
  }

  //console.log('requesting date: ' + date);
  var dateRange = calagator.prepare_date_range(date);
  console.log(dateRange);

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
  console.log(options);

  rp(options)
    .then(function (events) {
      // TODO: move processing of speech output to it's own function
      //console.log('events found: ' + events.length);
      events = _.orderBy(events,['start_time']);
      // TODO adjust for DST non DST
      var dstOffset = moment().isDST() ? '-07:00' : '-08:00';
      console.log(dstOffset);
      var start = dateRange.range[0] + 'T00:00:00' + dstOffset;
      var end   = dateRange.range[1] + 'T23:59:59' + dstOffset;
      console.log('event count: ' + events.length);
      events = _.filter(events, function(o) { 
        return !moment(o.start_time,moment.ISO_8601).isAfter(moment(end)) && moment(o.start_time,moment.ISO_8601).isSameOrAfter(moment(start)); 
      });
      console.log('event count after filter: ' + events.length);
      response.say('Calagator finds ' + events.length + (query ? ' ' + query : '' ) + (events.length > 1 || events.length == 0 ? ' events' : ' event'));
      response.say("for the " + dateRange.type + " of " + moment(dateRange.range[0]).format(dateRange.rangeStartFormat));
      _.forEach(events, function(anEvent) {
        response.say("<p>");
        response.say("<s>");
          var title = anEvent.title.replace(/&/, 'and');
          title = title.replace(/-/,'');
        response.say(title + " <break strength='medium' /> starting at "+moment(anEvent.start_time).tz('America/Los_Angeles').format(dateRange.spokenDateFormat));
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
  var dateRange = {};

  //console.log(calagator.dateTypes);

  for (var i = 0; i < calagator.dateTypes.length; i++) {
    //console.log('loop: ' + i);
    if(date.match(calagator.dateTypes[i].regex)){
      //console.log('match');
      dateRange.type = calagator.dateTypes[i].dateType;
      dateRange.range = calagator.dateTypes[i].transform(date);
      dateRange.spokenDateFormat = calagator.dateTypes[i].spokenDateFormat;
      dateRange.rangeStartFormat = calagator.dateTypes[i].rangeStartFormat;
      //console.log(dateRange);
      break;
    }
  }
  return dateRange;
}

calagator.dateTypes = [
  { dateType:"Day",
    regex:/\d{4}-\d{2}-\d{2}/,
    spokenDateFormat: 'h:mm a',
    rangeStartFormat: 'MMMM Do',
    transform:function(date){ 
      return [date,date];
    }},
  { dateType:"Week" ,
    regex:/\d{4}-W\d{2}(?!-WE)/,
    spokenDateFormat: 'h:mm a dddd',
    rangeStartFormat: 'MMMM Do',
    transform:function(date){ 
      return [moment(date,'YYYY-WW').startOf('isoWeek').format('YYYY-MM-DD'), moment(date,'YYYY-WW').endOf('isoWeek').format('YYYY-MM-DD')];
    }},
  { dateType:"Weekend",
    regex:/\d{4}-W\d{2}-WE/,
    spokenDateFormat: 'h:mm a dddd',
    rangeStartFormat: 'MMMM Do',
    transform:function(date){ 
      if(match = date.match(/\d{4}-W\d{1,2}/)){
        date = match[0];
      }
      return [moment(date,'YYYY-WW').endOf('isoWeek').subtract(1,'days').format('YYYY-MM-DD'),moment(date,'YYYY-WW').endOf('isoWeek').format('YYYY-MM-DD')];
    }},
  { dateType:"Month",
    regex:/\d{4}-\d{2}(?!-\d{1,2})/,
    spokenDateFormat: 'h:mm a dddd [the] Do',
    rangeStartFormat: 'MMMM',
    transform:function(date){ 
      return [moment(date).startOf('month','YYYY-MM').format('YYYY-MM-DD'), moment(date, 'YYYY-MM').endOf('month').format('YYYY-MM-DD')];
    }},
  { dateType:"Year",
    regex:/\d{4}(?!-W*\d{1,2})/,
    spokenDateFormat: 'h:mm a dddd MMMM Do',
    rangeStartFormat: 'YYYY',
    transform:function(date){ 
      return [moment(date,'YYYY').startOf('year').format('YYYY-MM-DD'), moment(date,'YYYY').endOf('year').format('YYYY-MM-DD')];
    }},
  { dateType:"Decade",
    regex:/\d{3}X/,
    spokenDateFormat: 'h:mm a dddd MMMM Do',
    rangeStartFormat: 'YYYY',
    transform:function(date){ 
      // get decade
      match = date.match(/\d{3}(?=X)/);
      var start = match[0] + 0;
      var end = match[0] + 9;
      return [moment(start,'YYYY').startOf('year').format('YYYY-MM-DD'), moment(end,'YYYY').endOf('year').format('YYYY-MM-DD')];
    }}
];
module.exports = calagator;
