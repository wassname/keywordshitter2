var keywordsToDisplay = [];
var hashMapResults = {};
var numOfInitialKeywords = 0;
var doWork = false;
var keywordsToQuery = [];
var keywordsToQueryIndex = 0;
var queryLock = false;



var table;
var prefixes;
var suffixes;
var objectStore;

var myIp;


$.getJSON('https://api.ipify.org?format=json', function (data) {
    myIp = data.ip;
});
// $.getJSON("http://jsonip.com?callback=?", function (data) {
//     myIp = data.host;
// });




// TODO Implement alternative services
// Ref: https://github.com/estivo/Instantfox/blob/master/firefox/c1hrome/content/defaultPluginList.js
// Ref: https://github.com/bnoordhuis/mozilla-central/tree/master/browser/locales/en-US/searchplugins
services={
        "google":
        "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&q=${query}&ds=${site}&gl=${country}",
        "yahoo":
        "https://search.yahoo.com/sugg/ff?output=fxjson&appid=ffd&command=${query}",
        "bing": "http://api.bing.com/osjson.aspx?query=${query}",
        "ebay":
        "http://autosug.ebay.com/autosug?kwd=${query}&_jgr=1&sId=0&_ch=0&callback=nil",
        "amazon":
        "http://completion.amazon.co.uk/search/complete?method=completion&q=${query}&search-alias=aps&mkt=4",
        "twitter":
        "https://twitter.com/i/search/typeahead.json?count=${max_results}&q=${query}&result_type=topics&src=SEARCH_BOX"
    };
function ebayParser(){}
    // s = req.lstrip('/**/nil/(').rstrip(')')
    // sugg_texts = json.loads(s)['res']['sug']
    // print('j', sugg_texts)
    // return {'sugg_texts': sugg_texts}


function twitterParser(){}
    // j = json.loads(req)
    // return {
    //     'sugg_texts': [t['topic'] for t in j['topics']],
    //     'meta': j,
    //     'relevances': [t['rounded_score'] for t in j['topics']],
    // }
var RESPONSE_TEMPLATES = {
    "google": ['query', 'sugg_texts', 'sugg_titles', '_', 'meta'],
    "google_maps": ['query', 'sugg_texts', 'sugg_titles', '_', 'meta'],
    "yahoo": ['query', 'sugg_texts'],
    "bing": ['query', 'sugg_texts'],
    "bing_search": ['query', 'sugg_texts'],
    "ebay": ebayParser,
    "amazon": ['query', 'sugg_texts'],
    "twitter": twitterParser
};

// setup a db. Ref: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

/** Basic error handler **/
function errorHandler(){
    console.error(this,arguments);
    return this; // for chaining
}
var db;
var dbReq = window.indexedDB.open("KeywordShitter2", 2);
dbReq.onerror = function (event) {
    console.error('dbReq', event);
};
dbReq.onsuccess = function (event) {
    // Do something with request.result!
    console.log('dbReq', event);
    db = event.target.result;
    db.onerror = function (event) {
        // Generic error handler for all errors targeted at this database's
        // requests!
        console.error("Database error: " + event.target.errorCode);
    };
};
dbReq.onupgradeneeded = function (event) {
    console.log("running onupgradeneeded");
    db = event.target.result;

    if (!db.objectStoreNames.contains("suggestions")) {
        objectStore = db.createObjectStore("suggestions", {
            autoIncrement: true
        });

        // Create an index to search suggestions by
        // he query that prompted the suggestion
        objectStore.createIndex("search", "search", {
            unique: false
        });
        // and by suggestion
        objectStore.createIndex("keyword", "keyword", {
            unique: false
        });

    } else {
        // objectStore = db.objectStore("customers");
    }
};

window.setInterval(DoJob, 750);

function StartJob() {
    if (doWork === false) {
        hashMapResults = {};
        keywordsToQuery = [];
        keywordsToQueryIndex = 0;

        hashMapResults[""] = 1;
        // hashMapResults[" "] = 1;
        // hashMapResults["  "] = 1;

        // update config
        prefixes = $('#prefixes').val().split(',');
        suffixes = $('#suffixes').val().split(',');

        var ks = $('#input').val().split("\n");
        var i = 0;
        for (i = 0; i < ks.length; i++) {
            keywordsToQuery[keywordsToQuery.length] = ks[i];

        }
        numOfInitialKeywords = keywordsToQuery.length;
        FilterAndDisplay();

        doWork = true;
        $('#startjob').val('Stop Job').text('Stop shitting').addClass('btn-danger');
        // $('#input').hide();

    } else {
        doWork = false;
        $('#startjob').val('Start Job').text('Start shitting').removeClass('btn-danger');
        // $('#input').show();
        FilterAndDisplay();
        table.draw();
        table.columns.adjust();
        saveSettings();
    }
}

function DoJob() {
    if (doWork === true && queryLock === false) {
        if (keywordsToQueryIndex < keywordsToQuery.length) {
            var currentKw = keywordsToQuery[keywordsToQueryIndex];
            if (currentKw[currentKw.length - 1] != '✓') {
                QueryKeyword(currentKw);
            }
            keywordsToQueryIndex++;
        } else {
            if (numOfInitialKeywords != keywordsToQuery.length) {
                doWork = false;
                $('#startjob').val('Start Job').text('Start shitting').removeClass('btn-danger');
                $('#input').show();
                FilterAndDisplay();
                table.draw();
                table.columns.adjust();
            } else {
                keywordsToQueryIndex = 0;
            }
        }
    }
}

/** Make permutations of results and add to queue **/
function permuteResultsToQueue(retList, search){

    // sort so the shortest is first in the queue
    retList.sort(function (a, b) {
      return a.length - b.length;
    });

    for (var i = 0; i < retList.length; i++) {
        var cleanKw = CleanVal(retList[i]);
        if (cleanKw.length && !hashMapResults[cleanKw]){
            hashMapResults[cleanKw] = 1;

            // add base suggestion to queue
            if (cleanKw!==search)
                keywordsToQuery[keywordsToQuery.length] = cleanKw;

            // add prefix permutations
            for (var k = 0; k < prefixes.length; k++) {
                var chr = prefixes[k];
                var currentx = chr + ' ' + cleanKw;
                keywordsToQuery[keywordsToQuery.length] = currentx;
                hashMapResults[currentx] = 1;
            }
            // add suffix permutations
            for (var j = 0; j < prefixes.length; j++) {
                var chr = prefixes[j];
                var currentx = cleanKw + ' ' + chr;
                keywordsToQuery[keywordsToQuery.length] = currentx;
                hashMapResults[currentx] = 1;
            }
        }
    }
}

/** Display data from db upon pressing load button **/
function loadFromDB(){
    var reqObj = db.transaction(["suggestions"],"readonly").
        objectStore("suggestions")
        .getAll()
        .onsuccess = function(e) {
            if (e.target.result.length){
                table.data(e.target.result);
                var data =[];
                for (var i = 0; i < e.target.result.length; i++) {
                    var d = e.target.result[i];
                    data.push([i,d.keyword,d.Length,null,null,d.search]);
                }
                table.rows.add(data);
            }
            table.draw(false);
        };
        reqObj.onerror=errorHandler;
}

/** Display results **/
function displayResults(retList, search, dontDisplay){






    for (var i = 0; i < retList.length; i++) {
        var  cleanKw = CleanVal(retList[i]);

        // we get an annoying popup alert if we add undefined values, catch them
        if (cleanKw===undefined||table.rows()[0].length===undefined||cleanKw.length===undefined,search===undefined){
            console.error('Undefined values',{
                id: table.rows()[0].length,
                keyword: cleanKw,
                length: cleanKw? cleanKw.length: undefined,
                search:search
            });
            continue;

        } else if (cleanKw!==undefined && cleanKw.length){
        // Check if suggestion is already displayed before adding
        // var matches = table.data().filter(function(v){return v[1]===cleanKw && v[5]==search;}).count();
        // if (!matches)
            table.row.add([
                table.rows()[0].length,
                cleanKw,
                cleanKw.length,
                null,
                null,
                search]);
        }
    }
    if (!dontDisplay) table.draw(false);
}

/** Store new results in db and hashmap **/
function storeResults(retList, search, url){

    for (var i = 0; i < retList.length; i++) {
        var cleanKw = CleanVal(retList[i]);
        if (cleanKw.length){
            // TODO check if I should add in bulk?

            // add to db
            var transaction = db.transaction(["suggestions"], "readwrite");
            transaction.onerror = errorHandler;
            var objectStore = transaction.objectStore("suggestions");
            addReq = objectStore.add({
                keyword: cleanKw,
                Length: cleanKw.length,
                search: search,
                ip: myIp,
                url: this.url,
                time: (new Date()).toUTCString()
            });
            addReq.onerror=errorHandler;
        }

    }
}

/** mark a search as done in the queue **/
function markAsDone(search){
    // mark as done in queue
    var found=false;
    for (var l = 0; l < keywordsToQuery.length; l++) {
        if (keywordsToQuery[l]==search){
            keywordsToQuery[l]+=' ✓';
            found=true;
            break;
        }
    }
    if (!found){console.error('Did not find ', search, 'in queue');}
}

/** Get search suggestions for a keyword **/
function QueryKeyword(search) {
    var querykeyword = search;
    var queryresult = '';
    queryLock = true;

    // first check in db
    var reqObj = db.transaction(["suggestions"],"readonly").
        objectStore("suggestions")
        .index("search")
        .getAll(search)
        .onsuccess = function(e) {
            // console.log(e.target.result);
            if (e.target.result.length){
                // search was done previously so display results from db
                var retList = [];
                for (var i = 0; i < e.target.result.length; i++) {
                    retList.push(e.target.result[i].keyword);
                }
                displayResults(retList,search);
                markAsDone(search);
                permuteResultsToQueue(retList);
                queryLock = false;
            }
            else {
                // search not done, lets do the query
                $.ajax({
                    url: "http://suggestqueries.google.com/complete/search",
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    data: {
                        q: search,
                        client: "chrome"
                    },
                    success: function (res, statusText, jqXHR) {
                        // var search = res[0];
                        var retList = res[1];
                        var char, currentx;

                        storeResults(retList, search, this.url);
                        displayResults(retList, search);
                        permuteResultsToQueue(retList);
                        markAsDone(search);

                        queryLock = false;

                    },
                    error: function(){
                        queryLock = false;
                    }
                });
            }
        };
        reqObj.onerror=errorHandler;
}

/** Clean input, may not all be needed **/
function CleanVal(input) {
    var val = input;

    // legacy
    // val = val.replace("<b>", "");
    // val = val.replace("</b>", "");
    // val = val.replace("</b>", "");
    // val = val.replace("<b>", "");
    // val = val.replace("</b>", "");
    // val = val.replace("<b>", "");
    // val = val.replace("<b>", "");
    // val = val.replace("</b>", "");
    // val = val.replace("&amp;", "&");
    // val = val.replace("<b>", "");
    // val = val.replace("&", "");
    // val = val.replace("&#39;", "'");
    // val = val.replace("#39;", "'");
    // val = val.replace("</b>", "");
    // val = val.replace("–", "2013");

    // this removes navigation suggestions
    if (val.length > 4 && val.substring(0, 4) == "http") val = "";
    return val;
}

/** TODO get this working **/
function Filter(listToFilter) {
    var retList = listToFilter;

    if ($("#filter-positive").val().length > 0) {
        var filteredList = [];
        var filterContains = $("#filter-positive").val().split("\n");
        for (var i = 0; i < retList.length; i++) {
            var currentKeyword = retList[i];
            var boolContainsKeyword = false;
            for (var j = 0; j < filterContains.length; j++) {
                if (filterContains[j].length > 0) {
                    if (currentKeyword.indexOf(filterContains[j]) != -1) {
                        boolContainsKeyword = true;
                        break;
                    }
                }
            }

            if (boolContainsKeyword) {
                filteredList[filteredList.length] = currentKeyword;
            }
        }

        retList = filteredList;
    }

    if ($("#filter-negative").val().length > 0) {
        var filteredList = [];
        var filterContains = $("#filter-negative").val().split("\n");
        for (var i = 0; i < retList.length; i++) {
            var currentKeyword = retList[i];
            var boolCleanKeyword = true;
            for (var j = 0; j < filterContains.length; j++) {
                if (filterContains[j].length > 0) {
                    if (currentKeyword.indexOf(filterContains[j]) >= 0) {
                        boolCleanKeyword = false;
                        break;
                    }
                }
            }

            if (boolCleanKeyword) {
                filteredList[filteredList.length] = currentKeyword;
            }
        }

        retList = filteredList;
    }

    return retList;
}

function FilterAndDisplay() {
    var i = 0;
    var sb = '';
    var outputKeywords = Filter(keywordsToQuery);
    for (i = 0; i < outputKeywords.length; i++) {
        sb += outputKeywords[i];
        sb += '\n';
    }
    $("#input").val(sb);
    $("#numofkeywords").html('Queue:' + outputKeywords.length + ', Results: ' + table.data().length);
}

/** read settings from webpage **/
// function readSettings(){
//     rateLimit = $('#service').val();
//     filterNegative = $('#filter-negative').val();
//     filterPositive = $('#filter-positive').val();
//     rateLimit = $('#rate-limit').val();
//     // input = $('#input').val();
//     prefixes = $('#prefixes').val();
//     suffixes = $('#suffixes').val();
// }
/** load settings from localStorage **/
function loadSettings(){
    // TODO do table settings as well, e.g. column visibilitity
    if (localStorage.service) $("#service").val( localStorage.service );
    if (localStorage.filterNegative) $("#filter-negative").val( localStorage.filterNegative );
    if (localStorage.filterPositive) $("#filter-positive").val( localStorage.filterPositive );
    if (localStorage.rateLimit) $("#rate-limit").val( localStorage.rateLimit );
    if (localStorage.input) $("#input").val( localStorage.input );
    if (localStorage.prefixes) $("#prefixes").val( localStorage.prefixes );
    if (localStorage.suffixes) $("#suffixes").val( localStorage.suffixes );

}
/** save settings to localStorage. **/
function saveSettings(){
    localStorage.service = $('#service').val();
    localStorage.filterNegative = $('#filter-negative').val();
    localStorage.filterPositive = $('#filter-positive').val();
    localStorage.rateLimit = $('#rate-limit').val();
    localStorage.input = $('#input').val();
    localStorage.prefixes = $('#prefixes').val();
    localStorage.suffixes = $('#suffixes').val();
}
function reset(){
    table.clear();
    table.draw();
    $('#input').val('');
    saveSettings();
}

$(document).ready(function () {
    loadSettings();
    table = $('#outtable').DataTable({
        pageLength: 25,
        dom:
        "<'row'<'col-sm-5'B><'col-sm-7'<'pull-right'p>>>" +
        "<'row'<'col-sm-8'i><'col-sm-4'<'pull-right'f>>>" +
            "<'row'<'col-sm-12'tr>>",
        buttons: ['copyHtml5', 'csvHtml5','colvis','pageLength'],
        "columnDefs": [
        {
            "name": "id",
            "targets": 0,
            "visible": false,
        }, {
            "name": "keyword",
            "targets": 1
        }, {
            "name": "length",
            "targets": 2,
            "visible": false,
        }, {
            "name": "volume",
            "targets": 3,
            "visible": false,
        }, {
            "name": "cpc",
            "targets": 4,
            "visible": false,
        }, {
            "name": "search",
            "targets": 5,
            "visible": false,
        }],
        order: [[ 0, 'desc' ]],
        colReorder: {},
        stateSave: true
    });
});
