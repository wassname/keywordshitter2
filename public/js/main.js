// quick way to check if we already have keyword
var hashMapInputs = {};

// keeping track of queue
var numOfInitialKeywords = 0;
var keywordsToQuery = [];
var keywordsToQueryIndex = 0;

// flags
var doWork = false;
var queryLock = false;

var maxQueueDisplay = 1000;
var db;
var table;
var prefixes;
var suffixes;
var myIp;




/**
 * Get the service url based on options set in the dom.
 * @return {String} A jsonp url for search suggestions with query missing from the end.
 */
function getUrl(options){
    // Ref: https://github.com/estivo/Instantfox/blob/master/firefox/c1hrome/content/defaultPluginList.js
    // Ref: https://github.com/bnoordhuis/mozilla-central/tree/master/browser/locales/en-US/searchplugins
    // Ref: https://developers.google.com/custom-search/json-api/v1/reference/cse/list
    // https://developers.google.com/custom-search/docs/ref_languages
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
            "https://twitter.com/i/search/typeahead.json?count=30&result_type=topics&src=SEARCH_BOX&callback=?&q=",
            "baidu": "http://suggestion.baidu.com/su?cb=?&wd=",
            "yandex": "https://yandex.com/suggest/suggest-ya.cgi?callback=?&q=?&n=30&v=4&uil={lang}&part="
        };

    options = getOptions(options);
    return _.template(services[options.service])(options);
}


/** Parse response per service **/
function parseServiceResponse(res,options){
    // Each take a json response tand return a keyword array
    RESPONSE_TEMPLATES = {
        // opensearch default
        "default": function (res) {
            return res[1];
        },
        "yahoo": function (res) {
            return _.map(res.gossip.results, 'key');
        },
        "ebay": function (res) {
            return res.res ? res.res.sug : undefined;
        },
        "twitter": function (res) {
            return _.concat(res.users, _.map(res.topics, 'topic'), res.hashtags, res.oneclick);
        },
        "baidu": function (res) {
            return res.s;
        },
        "yandex": function(res){
            return _.map(res[1], function(r){
                return typeof r === 'string' ? r : r[1];
            });
        },
    };
    options = getOptions(options);
    var parser = RESPONSE_TEMPLATES[options.service] || RESPONSE_TEMPLATES["default"];
    return parser(res);
}

function setUpDb(success){
    // setup a db. Ref: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
    var dbReq = window.indexedDB.open("KeywordShitter2", 3);
    /** Error handler for all child transactions as events bubbe up **/
    dbReq.onerror = function (event) {
        return console.error('Error opening indexedDB database KeywordShitter2', event);
    };
    dbReq.onsuccess = function (event) {
        db = event.target.result;
        db.onerror = function (event) {
            // Generic error handler requests
            if (event && event.target && event.target.error)
                console.error("Database error",event.target.error.errorCode, event.target.error.message, event);
            else
                console.error("Database error",arguments);
            return this;
        };
        if (success) success(db,dbReq);
        return db;
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

        return db;
    };
    return dbReq;
}



function StartJob() {
    if (doWork === false) {
        hashMapInputs = {};
        keywordsToQuery = [];
        keywordsToQueryIndex = 0;

        hashMapInputs[""] = 1;
        // hashMapInputs[" "] = 1;
        hashMapInputs["  "] = 1;

        // update config
        prefixes = $('#prefixes').val().split(',');
        suffixes = $('#suffixes').val().split(',');

        // get queries from the input
        var ks = $('#input').val().split("\n");
        for (var i = 0; i < ks.length; i++) {
            if (ks[i].trim().length)
                keywordsToQuery[keywordsToQuery.length] = ks[i];
        }
        numOfInitialKeywords = keywordsToQuery.length;

        // add variations of the initial terms
        // (before we start adding variations of the results)
        if (!numOfInitialKeywords)
            permuteResultsToQueue([' ']);
        else
            permuteResultsToQueue(keywordsToQuery);
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
    var chr, currentx, currentKw;

    // sort so the shortest is first in the queue
    retList.sort(function (a, b) {
      return a.length - b.length;
    });

    // add each result to list first before permutations
    for (var j = 0; j < retList.length; j++) {
        cleanKw = CleanVal(retList[j]);
        // add base suggestion to queue if it's not already done and isn't empty
        if (cleanKw && cleanKw.trim().length && cleanKw!==search && !hashMapInputs[cleanKw])
            keywordsToQuery[keywordsToQuery.length] = cleanKw;
        hashMapInputs[cleanKw] = 1;
    }
    for (var i = 0; i < retList.length; i++) {
        cleanKw = CleanVal(retList[i]);
        if (cleanKw.length){

            // add prefix permutations
            for (var k = 0; k < prefixes.length; k++) {
                chr = prefixes[k];
                currentx = chr + ' ' + cleanKw;
                if (!hashMapInputs[currentx])
                    keywordsToQuery[keywordsToQuery.length] = currentx;
                hashMapInputs[currentx] = 1;
            }
            // add suffix permutations
            for (var j = 0; j < prefixes.length; j++) {
                chr = prefixes[j];
                currentx = cleanKw + ' ' + chr;
                if (!hashMapInputs[currentx])
                    keywordsToQuery[keywordsToQuery.length] = currentx;
                hashMapInputs[currentx] = 1;
            }
        }
    }
}

/** export db as json **/
function exportDB(success){
    var reqObj = db.transaction(["suggestions"],"readonly")
        .objectStore("suggestions")
        .getAll();
        reqObj.onsuccess = function(e) {
            var blob, name;
            if (e.target.result.length){
                var jsonData = JSON.stringify(e.target.result);
                blob = new Blob([jsonData], {type: "octet/stream"});
                var timeStamp = (new Date()).toISOString().replace(/[:\.]/g,'_').slice(0,-5);
                name = 'keywordshitter_'+timeStamp+'_r'+e.target.result.length+'.json';
                saveAs(blob,name);
                if (success) success(blob);
            }
            return blob;
        };
        return reqObj;
}

/** Display data from db upon pressing load button **/
function loadFromDB(){
    var reqObj = db.transaction(["suggestions"],"readonly")
        .objectStore("suggestions")
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
                    //
                    data.push(da);
                }
                table.rows.add(data);
                return table.draw(false);
            }
        };
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

/** Takes url string and returns domain e.g. www.google.com or google.com
  * and some extra params to identify is
  **/
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

    // custom, add ds= param to distinguish googles etc diff searchs
    var mr = url.match('ds=(..?)&');
    if (mr && mr[1] && mr[1].length) domain+='&ds='+mr[1];

    var mr = url.match('gl=(..?)&');
    if (mr && mr[1] && mr[1].length) domain+='&gl='+mr[1];

    var mr = url.match('hl=(..?)&');
    if (mr && mr[1] && mr[1].length) domain+='&hl='+mr[1];

    // lang code for yandex
    var mr = url.match('uil=(..?)&');
    if (mr && mr[1] && mr[1].length) domain+='&uil='+mr[1];

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
                            console.warn('No results for query "',search,'" ');
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

/** display the queue, and update description of it **/
function FilterAndDisplay() {
    var i = 0;
    var sb = '';

    var outputKeywords = keywordsToQuery;
    for (i = 0; i < Math.min(outputKeywords.length,maxQueueDisplay); i++) {
        sb += outputKeywords[i];
        sb += '\n';
    }
    if (outputKeywords.length>maxQueueDisplay) sb+='...\n';
    $("#input").val(sb);
    $("#numofkeywords").html('Queue:' + outputKeywords.length);
}


/** overrides default with dom options with arguments options **/
function getOptions(argOptions){
    var defaultOptions={}; // for now defaults are set in html
    if (argOptions===undefined) argOptions={};
    return _.defaults(argOptions,getDomOptions(),defaultOptions);
}

/** read settings from webpage **/
function getDomOptions(){
    return {
        service : $('#service').val(),
        filterNegative: $('#filter-negative').val(),
        filterPositive: $('#filter-positive').val(),
        rateLimit: $('#rate-limit').val(),
        // input: $('#input').val(),
        prefixes: $('#prefixes').val(),
        suffixes: $('#suffixes').val(),
        country: $('#country').val(),
        lang: $('#lang').val(),
    };
}

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

/** reset inputs and results, but not settings **/
function reset(){
    table.clear();
    table.draw();
    $('#input').val('');
    saveSettings();
}

function kws2Init(){
    setUpDb();

    window.setInterval(DoJob, 750);
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
            'colvis',
            'pageLength',
            {
                 extend: 'collection',
                 text: 'Export',
                 buttons: [
                     'copyHtml5',
                     'csvHtml5',
                 ]
             }
            // {
            //     extend: 'csvHtml5',
            //     fieldBoundary: "",
            //     text: 'Copy keywords',
            //     // 'customize': function(data,options){return data.split('\n').join(',');},
            //     header: false,
            //     exportOptions: {
            //         stripNewlines: true,
            //         stripHtml: true,
            //         decodeEntities: true,
            //         columns: 1,
            //         // format:{
            //         //     body: function(html,i){console.log(html);return html}
            //         // }
            //     }
            // },
        ],
        "columnDefs": [
        {
            "name": "id",
            "targets": 0,
            "visible": false,
        }, {
            "responsivePriority": 1,
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
            "responsivePriority": 3,
            "targets": 5,
            "visible": false,
        }, {
            "name": "domain",
            "responsivePriority": 2,
            "targets": 6,
            "visible": false,
        }],
        order: [[ 0, 'desc' ]],
        // colReorder: {},
        stateSave: true,
        fixedHeader: true,
        // responsive: true,
        // scrollY:        500,
        // deferRender:    true,
        // scroller:       true
    });

    $.getJSON('https://api.ipify.org?format=json', function (data) {
        myIp = data.ip;
    });

}
