var keywordsToDisplay = [];
var hashMapResults = {};
var numOfInitialKeywords = 0;
var doWork = false;
var keywordsToQuery = [];
var keywordsToQueryIndex = 0;
var queryflag = false;



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


// Ref: https://github.com/estivo/Instantfox/blob/master/firefox/c1hrome/content/defaultPluginList.js
// Ref: https://github.com/bnoordhuis/mozilla-central/tree/master/browser/locales/en-US/searchplugins
services={
        "google":
        "http://suggestqueries.google.com/complete/search?client=chrome&hl=${lang}&q=${query}&ds=${site}&gl=${country}",
        "duckduckgo": "https://ac.duckduckgo.com/ac/?q=${query}&type=list",
        "yahoo":
        "https://search.yahoo.com/sugg/ff?output=fxjson&appid=ffd&command=${query}",
        "bing": "http://api.bing.com/osjson.aspx?query=${query}",
        "ebay":
        "http://autosug.ebay.com/autosug?kwd=${query}&_jgr=1&sId=0&_ch=0&callback=nil",
        "wikipedia":
        "http://en.wikipedia.org/w/api.php?action=opensearch&search=${query}",
        "amazon":
        "http://completion.amazon.co.uk/search/complete?method=completion&q=${query}&search-alias=aps&mkt=4",
        "startpage.com":
        "https://startpage.com/cgi-bin/csuggest?output=json&pl=ff&lang=english&query=${query}",
        "twitter":
        "https://twitter.com/i/search/typeahead.json?count=${max_results}&q=${query}&result_type=topics&src=SEARCH_BOX"
    };
var RESPONSE_TEMPLATES = {
    "google": ['query', 'sugg_texts', 'sugg_titles', '_', 'meta'],
    "google_maps": ['query', 'sugg_texts', 'sugg_titles', '_', 'meta'],
    "duckduckgo": ['query', 'sugg_texts'],
    "yahoo": ['query', 'sugg_texts'],
    "bing": ['query', 'sugg_texts'],
    "bing_search": ['query', 'sugg_texts'],
    "ebay": ebayParser,
    "wikipedia": ['query', 'sugg_texts'],
    "amazon": ['query', 'sugg_texts'],
    "startpage.com": ['query', 'sugg_texts'],
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

        // Create an index to search suggestions by search.
        objectStore.createIndex("search", "search", {
            unique: false
        });
        objectStore.createIndex("keyword", "keyword", {
            unique: false
        });
        objectStore.createIndex("keyword", "keyword", {
            unique: true
        });

    } else {
        // objectStore = db.objectStore("customers");
    }
};

window.setInterval(DoJob, 750);

function StartJob() {
    if (doWork == false) {
        keywordsToDisplay = [];
        hashMapResults = {};
        keywordsToQuery = [];
        keywordsToQueryIndex = 0;

        hashMapResults[""] = 1;
        hashMapResults[" "] = 1;
        hashMapResults["  "] = 1;

        prefixes = $('#prefixes').val().split(',');
        suffixes = $('#suffixes').val().split(',');

        var ks = $('#input').val().split("\n");
        var i = 0;
        for (i = 0; i < ks.length; i++) {
            keywordsToQuery[keywordsToQuery.length] = ks[i];
            // keywordsToDisplay[keywordsToDisplay.length] = {
            //     Keyword: ks[i]
            // };

            // var j = 0;
            // for (j = 0; j < 26; j++) {
            //     var chr = String.fromCharCode(97 + j);
            //     var currentx = ks[i] + ' ' + chr;
            //     keywordsToQuery[keywordsToQuery.length] = currentx;
            //     hashMapResults[currentx] = 1;
            // }
        }
        numOfInitialKeywords = keywordsToDisplay.length;
        FilterAndDisplay();

        doWork = true;
        $('#startjob').val('Stop Job').text('Stop shitting').addClass('btn-danger');
        $('#input').hide();

    } else {
        doWork = false;
        $('#startjob').val('Start Job').text('Start shitting').removeClass('btn-danger');
        $('#input').show();
        FilterAndDisplay();
        table.draw();
        table.columns.adjust();
        saveSettings();
    }
}

function DoJob() {
    if (doWork === true && queryflag === false) {
        if (keywordsToQueryIndex < keywordsToQuery.length) {
            var currentKw = keywordsToQuery[keywordsToQueryIndex];
            if (currentKw[currentKw.length - 1] != '✓') {
                QueryKeyword(currentKw);
            }
            keywordsToQueryIndex++;
        } else {
            if (numOfInitialKeywords != keywordsToDisplay.length) {
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

/** Stem results and add to queue **/
function stemResults(retList, search){



    // stem the result and add too
    // sort so the shortest is first in the queue
    retList.sort(function (a, b) {
      return a.length - b.length;
    });
    for (var i = 0; i < retList.length; i++) {
        var currents = CleanVal(retList[i]);

        // add suggestion to queue
        if (currents!==search)
            keywordsToQuery[keywordsToQuery.length] = currents;

        // add permutations
        for (var k = 0; k < prefixes.length; k++) {
            var chr = prefixes[k];
            var currentx = chr + ' ' + currents;
            keywordsToQuery[keywordsToQuery.length] = currentx;
            hashMapResults[currentx] = 1;
        }
        for (var j = 0; j < prefixes.length; j++) {
            var chr = prefixes[j];
            var currentx = currents + ' ' + chr;
            keywordsToQuery[keywordsToQuery.length] = currentx;
            hashMapResults[currentx] = 1;
        }
    }
}

/** Get search suggestions for a keyword **/
function QueryKeyword(keyword) {
    var querykeyword = keyword;
    var queryresult = '';
    queryflag = true; // wait for this worker

    // first check in db
    var reqObj = db.transaction(["suggestions"],"readonly").
        objectStore("suggestions")
        .index("search")
        .getAll(keyword)
        .onsuccess = function(e) {
            console.log(e.target.result);
            if ('already exists', e.target.results){
                // TODO add
            }
            else {

                $.ajax({
                    url: "http://suggestqueries.google.com/complete/search",
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    data: {
                        q: querykeyword,
                        client: "chrome"
                    },
                    success: function (res, statusText, jqXHR) {
                        var search = res[0];
                        var retList = res[1];
                        var char, currentx;



                        // store results
                        for (var i = 0; i < retList.length; i++) {
                            var currents = CleanVal(retList[i]);
                            if (hashMapResults[currents] != 1) {
                                hashMapResults[currents] = 1;
                                var cleanKw = CleanVal(retList[i]);


                                // display
                                table.row.add([
                                    table.rows()[0].length,
                                    cleanKw,
                                    cleanKw.length,
                                    undefined,
                                    undefined,
                                    search])
                                    .draw(false);

                                // add to db
                                var transaction = db.transaction(["suggestions"], "readwrite");
                                transaction.onerror = errorHandler;
                                var objectStore = transaction.objectStore("suggestions");
                                addReq = objectStore.add({
                                    Keyword: cleanKw,
                                    Length: cleanKw.length,
                                    search: search,
                                    ip: myIp,
                                    url: this.url,
                                    time: (new Date()).toUTCString()
                                });
                                addReq.onerror=errorHandler;
                            }
                        }

                        stemResults(retList);

                        // now remove from the queue
                        // FIXME oh wait but that mean it progress up th queue by 2 instead of one
                        var found=false;
                        for (var l = 0; l < keywordsToQuery.length; l++) {
                            if (keywordsToQuery[l]==search){
                                // keywordsToQuery.splice(l,1);
                                keywordsToQuery[l]+=' ✓';
                                found=true;
                                break;
                            }
                        }
                        if (!found){console.error('Did not find ', search, 'in queue');}


                        // table.draw();
                        // FilterAndDisplay();
                        //
                        // var textarea = document.getElementById("input");
                        // textarea.scrollTop = textarea.scrollHeight;
                        //

                        queryflag = false;

                    }
                });
            }
        };
        reqObj.onerror=errorHandler;
}

function CleanVal(input) {
    var val = input;
    val = val.replace("\\u003cb\\u003e", "");
    val = val.replace("\\u003c\\/b\\u003e", "");
    val = val.replace("\\u003c\\/b\\u003e", "");
    val = val.replace("\\u003cb\\u003e", "");
    val = val.replace("\\u003c\\/b\\u003e", "");
    val = val.replace("\\u003cb\\u003e", "");
    val = val.replace("\\u003cb\\u003e", "");
    val = val.replace("\\u003c\\/b\\u003e", "");
    val = val.replace("\\u0026amp;", "&");
    val = val.replace("\\u003cb\\u003e", "");
    val = val.replace("\\u0026", "");
    val = val.replace("\\u0026#39;", "'");
    val = val.replace("#39;", "'");
    val = val.replace("\\u003c\\/b\\u003e", "");
    val = val.replace("\\u2013", "2013");
    if (val.length > 4 && val.substring(0, 4) == "http") val = "";
    return val;
}

function Filter(listToFilter) {
    var retList = listToFilter;

    if (document.getElementById("filter-positive").value.length > 0) {
        var filteredList = [];
        var filterContains = document.getElementById("filter-positive").value.split("\n");
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

    if (document.getElementById("filter-negative").value.length > 0) {
        var filteredList = [];
        var filterContains = document.getElementById("filter-negative").value.split("\n");
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
    document.getElementById("input").value = sb;
    document.getElementById("numofkeywords").innerHTML = '' + outputKeywords.length + ' : ' + keywordsToDisplay.length;
}



function get_kwkeg(){
    var kws = table
    .data()
    .filter( function ( value, index ) {
        return !value[3];
    }).pluck(1);

    var queries='kw%5B%5D='+kws.join('&kw%5B%5D=');

    var url = '//keywordkeg.com/service/1/getKeywordData.php?source=keyshi&apiKey=ed8bd29691f4d6a9eb8e032d82de9714&'+queries;
    $.ajax({
        url:url,
        crossDomain: true,
        headers: {"Access-Control-Allow-Origin": "*"},
        type: 'GET'
    }).success(function(data){
        for (var i = 0; i < data.length; i++) {
            data[i];
        }
    });


}

// function FilterIfNotWorking() {
//     if (doWork == false) {
//         FilterAndDisplay();
//     }
// }

//set options from localstorage and watch for changes
function loadSettings(){
    if (localStorage.service) $("#service").val( localStorage.service );
    if (localStorage.filterNegative) $("#filter-negative").val( localStorage.filterNegative );
    if (localStorage.filterPositive) $("#filter-positive").val( localStorage.filterPositive );
    if (localStorage.rateLimit) $("#rate-limit").val( localStorage.rateLimit );
    if (localStorage.input) $("#input").val( localStorage.input );
    if (localStorage.prefixes) $("#prefixes").val( localStorage.prefixes );
    if (localStorage.suffixes) $("#suffixes").val( localStorage.suffixes );

}
function saveSettings(){
    localStorage.service = $('#service').val();
    localStorage.filterNegative = $('#filter-negative').val();
    localStorage.filterPositive = $('#filter-positive').val();
    localStorage.rateLimit = $('#rate-limit').val();
    localStorage.input = $('#input').val();
    localStorage.prefixes = $('#prefixes').val();
    localStorage.suffixes = $('#suffixes').val();
}

$(document).ready(function () {

    loadSettings();



    table = $('#outtable').DataTable({
        //  "dom": '<"top"iflp<"clear">>rt<"bottom"ipB<"clear">>',
        //   responsive: true,
        pageLength: 25,
        //   bAutoWidth: false,
        //   dom: 'lfrtipB',
        dom: "<'row'<'col-sm-3'B><'col-sm-6'i><'col-sm-3'f>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-4'B><'col-sm-5'p><'col-sm-3'l>>",
        buttons: ['copyHtml5', 'csvHtml5'],
        "columnDefs": [{
            "name": "keyword",
            "targets": 0
        }, {
            "name": "length",
            "targets": 1
        }, {
            "name": "volume",
            "targets": 2
        }, {
            "name": "cpc",
            "targets": 3
        }, {
            "name": "search",
            "targets": 4
        }],
        //   aaSorting: [],
        // data: keywordsToDisplay
    });
    table.order([ 0, 'dec' ]);
});
