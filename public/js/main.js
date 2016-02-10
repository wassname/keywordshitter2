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







// TODO Implement alternative services
// Ref: https://github.com/estivo/Instantfox/blob/master/firefox/c1hrome/content/defaultPluginList.js
// Ref: https://github.com/bnoordhuis/mozilla-central/tree/master/browser/locales/en-US/searchplugins

/**
 * Get the service url based on options set in the dom.
 * @return {String} A jsonp url for search suggestions with query missing from the end.
 */
function getUrl(){
    services={
            "google":
            "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&gl=${country}&callback=?&q=",
            "google news":
            "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&ds=n&gl=${country}&callback=?&q=",
            "google shopping":
            "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&ds=sh&gl=${country}&callback=?&q=",
            "google books":
            "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&ds=bo&gl=${country}&callback=?&q=",
            "youtube":
            "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&ds=yt&gl=${country}&callback=?&q=",
            "google videos":
            "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&ds=v&gl=${country}&callback=?&q=",
            "google images":
            "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&ds=i&gl=${country}&callback=?&q=",
            "yahoo":
            "https://search.yahoo.com/sugg/ff?output=jsonp&appid=ffd&callback=?&command=",
            "bing": "http://api.bing.com/osjson.aspx?JsonType=callback&JsonCallback=?&query=",
            "ebay":
            "http://autosug.ebay.com/autosug?_jgr=1&sId=0&_ch=0&callback=?&kwd=",
            "amazon":
            "http://completion.amazon.co.uk/search/complete?method=completion&search-alias=aps&mkt=4&callback=?&q=",
            "twitter":
            "https://twitter.com/i/search/typeahead.json?count=30&result_type=topics&src=SEARCH_BOX&callback=?&q="
        };
    options={
        country: $('#country').val(),
        service: $('#service').val(),
        lang: $('#lang').val(),
    };
    return _.template(services[options.service])(options);
}

var RESPONSE_TEMPLATES = {
    "default": function(res){return res[1];},
    "google": function(res){return res[1];},
    "youtube": function(res){return res[1];},
    "yahoo": function(res){return _.map(res.gossip.results,'key');},
    "bing": function(res){return res[1];},
    "ebay": function(res){
        return res.res? res.res.sug: undefined;
    },
    "amazon": function(res){return res[1];},
    "twitter": function(res){return _.concat(res.users,_.map(res.topics,'topic'),res.hashtags,res.oneclick);}
};
/** Parse response per service **/
function parseServiceResponse(res){
    var service = $('#service').val();
    var parser = RESPONSE_TEMPLATES[service] || RESPONSE_TEMPLATES["default"];
    return parser(res);
}


// setup a db. Ref: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

/** Basic error handler **/
function errorHandler(){
    console.error(this,arguments);
    return this; // for chaining
}
var db;
var dbReq = window.indexedDB.open("KeywordShitter2", 3);
/** Error handler for all child transactions as events bubbe up **/
dbReq.onerror = function (event) {
    console.error('dbReq', event);
};
dbReq.onsuccess = function (event) {
    db = event.target.result;
    db.onerror = function (event) {
        // Generic error handler requests
        console.error("Database error: " + event.currentTarget.error.errorCode, event.currentTarget.error.message, event);
    };
};
dbReq.onupgradeneeded = function (event) {
    console.log("running onupgradeneeded");
    db = event.target.result;

    if (!db.objectStoreNames.contains("suggestions")) {
        var objectStore = db.createObjectStore("suggestions", {
            autoIncrement: true, keyPath: 'id'
        });
        // Create an index to search suggestions by
        // he query that prompted the suggestion
        if (!objectStore.indexNames.contains('search'))
            objectStore.createIndex("search", "search", {unique: false});

        // and by suggestion/keyword
        if (!objectStore.indexNames.contains('keyword'))
            objectStore.createIndex("keyword", "keyword", {unique: false});

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
        hashMapResults["  "] = 1;

        // update config
        prefixes = $('#prefixes').val().split(',');
        suffixes = $('#suffixes').val().split(',');

        var ks = $('#input').val().split("\n");
        for (var i = 0; i < ks.length; i++) {
            if (ks[i].trim().length)
                keywordsToQuery[keywordsToQuery.length] = ks[i];
        }
        numOfInitialKeywords = keywordsToQuery.length;
        if (!numOfInitialKeywords) permuteResultsToQueue([' ']);
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
                keywordsToQueryIndex++;
            } else {
                // we didn't do a query immediatly go to next query
                keywordsToQueryIndex++;
                DoJob();
            }

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
            if (cleanKw && cleanKw.trim().length && cleanKw!==search)
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
                /// grab the fields we want
                var data =[];
                for (var i = 0; i < e.target.result.length; i++) {
                    var d = e.target.result[i];
                    var da = [
                        d.id,
                        d.keyword,
                        d.length,
                        d.volume,
                        d.cpc,
                        d.search,
                        d.domain
                    ];
                    // also remove undefined so datatables doesn't bring up alerts
                    da = da.map(function(v){return v===undefined ? null: v;});
                    // parse nums
                    // da = da.map(v => /^[\d+\.]+$/.test(v) ? Number(v): v);
                    data.push(da);
                }
                table.rows.add(data);
            }
            return table.draw(false);
        };
        reqObj.onerror=errorHandler;
        return;
}

/** Display results **/
function displayResults(retList, search, dontDisplay, url,data){

    var rows=[];
    for (var i = 0; i < retList.length; i++) {
        var  cleanKw = CleanVal(retList[i]);

        // url might be in retlist
        if (url===undefined) url=data[i].url;

        var da = [
            table.rows()[0].length+i,
            cleanKw,
            cleanKw.length,
            null,
            null,
            search,
            extractDomain(url)
            ];

        // remove undefined values to avoid datatable alerts
        da = da.map(function(v){return v===undefined ? null: v;});

        // TODO Check if suggestion is already displayed before adding
        // var matches = table.data().filter(function(v){return v[1]===cleanKw && v[5]==search;}).count();
        // if (!matches)
        rows.push(da);
    }
    table.rows.add(rows);
    if (!dontDisplay) table.draw(false);
}

function extractDomain(url) {
    if (url===undefined) return null;
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

/** Store new results in db and hashmap **/
function storeResults(retList, search, url){

    // We will add the items async in order
    // Ref: http://stackoverflow.com/a/13666741/221742
    var transaction = db.transaction(["suggestions"], "readwrite");
    var store = transaction.objectStore("suggestions");
    var i=0;
    addNext();

    /** Like an async for loop to add each to db **/
    function addNext() {
        if (i<retList.length) {
                var cleanKw = CleanVal(retList[i]);
                if (cleanKw.length){
                addReq = store.add({
                    keyword: cleanKw,
                    length: cleanKw.length,
                    search: search,
                    ip: myIp,
                    url: url,
                    domain: extractDomain(url),
                    time: (new Date()).toUTCString()
                });
                addReq.onsuccess = addNext;

                ++i;
                return addReq;
            } else {
                // skip empty keywords
                ++i;
                return addNext.bind(this)();
            }
        } else {
            return;// console.debug('populate complete for suggestions of ', search);
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
            var domain = extractDomain(getUrl());
            var results = e.target.result.filter(function(r){return r.domain==domain;});
            // console.log(e.target.result);
            if (results.length){
                // search was done previously so display results from db
                var retList=_.map(results,'keyword');
                displayResults(retList,search,undefined,undefined,results);
                markAsDone(search);
                permuteResultsToQueue(retList);
                queryLock = false;

                // we didn't do a query immediatly go to next query
                DoJob();
            }
            else {
                // search not done, lets do the query
                url = getUrl()+search;
                $.ajax({
                    url: url,
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    success: function (res, statusText, jqXHR) {

                        var retList = parseServiceResponse(res);
                        var char, currentx;
                        if (retList && retList.length){
                            storeResults(retList, search, this.url);
                            displayResults(retList, search, undefined, this.url);
                            permuteResultsToQueue(retList);
                        } else {
                            console.warn('No reslts for query "',search,'" ', this.url);
                        }

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
    if (localStorage.country) $('#country').val(localStorage.country);
    if (localStorage.lang) $('#lang').val(localStorage.lang);
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
    localStorage.country = $('#country').val();
    localStorage.lang = $('#lang').val();
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
    //
    // $('#startjob').on('click',StartJob);
    // $('#reset').on('click',reset);
    // $('#load-from-cache').on('click',loadFromDB);

    loadSettings();
    table = $('#outtable').DataTable({
        pageLength: 50,
        "lengthMenu": [ 10, 25, 50, 75, 100,800],
        dom:
        "<'row'<'col-sm-5'B><'col-sm-7'<'pull-right'p>>>" +
        "<'row'<'col-sm-8'i><'col-sm-4'<'pull-right'f>>>" +
            "<'row'<'col-sm-12'tr>>",
        buttons: [
            'copyHtml5',
            'csvHtml5',
            'colvis',
            'pageLength',
            {
                extend: 'csvHtml5',
                fieldBoundary: "",
                text: 'Copy keywords',
                // 'customize': function(data,options){return data.split('\n').join(',');},
                header: false,
                exportOptions: {
                    stripNewlines: true,
                    stripHtml: true,
                    decodeEntities: true,
                    columns: 1,
                    // format:{
                    //     body: function(html,i){console.log(html);return html}
                    // }
                }
            },
        ],
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
        }, {
            "name": "domain",
            "targets": 6,
            "visible": false,
        }],
        order: [[ 0, 'desc' ]],
        colReorder: {},
        stateSave: true
    });
});

$.getJSON('https://api.ipify.org?format=json', function (data) {
    myIp = data.ip;
});
