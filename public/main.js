var keywordsToDisplay = new Array();
var hashMapResults = {};
var numOfInitialKeywords = 0;
var doWork = false;
var keywordsToQuery = new Array();
var keywordsToQueryIndex = 0;
var queryflag = false;



var table;
var prefixes;
var suffixes;
var objectStore;

var myIp;
$.getJSON("http://jsonip.com?callback=?", function (data) {
    myIp = data.host;
});


// setup a db. Ref: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
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
        objectStore.createIndex("keywords", "keywords", {
            unique: true
        });

    } else {
        objectStore = db.objectStore("customers");
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
            keywordsToQuery[keywordsToQuery.length] = {
                Keyword: ks[i]
            };
            keywordsToDisplay[keywordsToDisplay.length] = {
                Keyword: ks[i]
            };

            var j = 0;
            for (j = 0; j < 26; j++) {
                var chr = String.fromCharCode(97 + j);
                var currentx = ks[i] + ' ' + chr;
                keywordsToQuery[keywordsToQuery.length] = {
                    Keyword: currentx
                };
                hashMapResults[currentx] = 1;
            }
        }
        numOfInitialKeywords = keywordsToDisplay.length;
        FilterAndDisplay();

        doWork = true;
        $('#startjob').val('Stop Job').text('Stop Job').addClass('btn-danger');

    } else {
        doWork = false;
        $('#startjob').val('Start Job').text('Start Job').removeClass('btn-danger');
        FilterAndDisplay();
    }
}

function DoJob() {
    if (doWork == true && queryflag == false) {
        if (keywordsToQueryIndex < keywordsToQuery.length) {
            var currentKw = keywordsToQuery[keywordsToQueryIndex].Keyword;
            // if (currentKw[currentKw.length - 1] != '✓') {
                QueryKeyword(currentKw);
            // }
            keywordsToQueryIndex++;
        } else {
            if (numOfInitialKeywords != keywordsToDisplay.length) {
                doWork = false;
                $('#startjob').val('Start Job');
            } else {
                keywordsToQueryIndex = 0;
            }
        }
    }
}

function QueryKeyword(keyword) {
    var querykeyword = keyword;
    //var querykeyword = encodeURIComponent(keyword);
    var queryresult = '';
    queryflag = true;

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

            // sort so the shortest is first in the queue
            // retList.sort(function (a, b) {
            //   return a.length - b.length;
            // });

            var i = 0;
            for (i = 0; i < retList.length; i++) {
                var currents = CleanVal(retList[i]);
                if (hashMapResults[currents] != 1) {
                    hashMapResults[currents] = 1;
                    var cleanKw = CleanVal(retList[i]);

                    // add keyword to queue and display and db
                    keywordsToQuery[keywordsToQuery.length] = {
                        Keyword: currents
                    };
                    keywordsToDisplay[keywordsToDisplay.length] = {
                        Keyword: cleanKw
                    };

                    table.row.add([keywordsToDisplay.length, cleanKw, cleanKw.length, undefined, undefined, search]).draw(false);

                    // add to db
                    var transaction = db.transaction(["suggestions"], "readwrite");
                    transaction.onerror = console.error;
                    var objectStore = transaction.objectStore("suggestions");
                    objectStore.add({
                        Keyword: cleanKw,
                        Length: cleanKw.length,
                        search: search,
                        ip: myIp,
                        url: this.url,
                        time: (new Date()).toUTCString()
                    });

                    // stem the result and add too
                    for (var k = 0; k < prefixes.length; k++) {
                        var chr = prefixes[k];
                        var currentx = chr + ' ' + currents;
                        keywordsToQuery[keywordsToQuery.length] = {
                            Keyword: currentx
                        };
                        hashMapResults[currentx] = 1;
                    }
                    for (var j = 0; j < prefixes.length; j++) {
                        var chr = prefixes[j];
                        var currentx = currents + ' ' + chr;
                        keywordsToQuery[keywordsToQuery.length] = {
                            Keyword: currentx
                        };
                        hashMapResults[currentx] = 1;
                    }
                }
            }
            table.draw();
            // FilterAndDisplay();
            var textarea = document.getElementById("input");
            // textarea.scrollTop = textarea.scrollHeight;
            queryflag = false;

            // now remove from the queue
            // FIXME oh wait but that mean it progress up th queue by 2 instead of one
            // var found=false;
            // for (var l = 0; l < keywordsToQuery.length; l++) {
            //     if (keywordsToQuery[l].Keyword==search){
            //         // keywordsToQuery.splice(l,1);
            //         keywordsToQuery[l].Keyword+=' ✓';
            //         found=true;
            //         break;
            //     }
            // }
            // if (!found){console.error('Did not find ', search, 'in queue');}


        }
    });
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
        var filteredList = new Array();
        var filterContains = document.getElementById("filter-positive").value.split("\n");
        var i = 0;
        for (i = 0; i < retList.length; i++) {
            var currentKeyword = retList[i].Keyword;
            var boolContainsKeyword = false;
            var j = 0;
            for (j = 0; j < filterContains.length; j++) {
                if (filterContains[j].length > 0) {
                    if (currentKeyword.indexOf(filterContains[j]) != -1) {
                        boolContainsKeyword = true;
                        break;
                    }
                }
            }

            if (boolContainsKeyword) {
                filteredList[filteredList.length].Keyword = currentKeyword;
            }
        }

        retList = filteredList;
    }

    if (document.getElementById("filter-negative").value.length > 0) {
        var filteredList = new Array();
        var filterContains = document.getElementById("filter-negative").value.split("\n");
        var i = 0;
        for (i = 0; i < retList.length; i++) {
            var currentKeyword = retList[i].Keyword;
            var boolCleanKeyword = true;
            var j = 0;
            for (j = 0; j < filterContains.length; j++) {
                if (filterContains[j].length > 0) {
                    if (currentKeyword.indexOf(filterContains[j]) >= 0) {
                        boolCleanKeyword = false;
                        break;
                    }
                }
            }

            if (boolCleanKeyword) {
                filteredList[filteredList.length].Keyword = currentKeyword;
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
        sb += outputKeywords[i].Keyword;
        sb += '\n';
    }

    // document.getElementById("input").value = "";
    document.getElementById("input").value = sb;
    // document.getElementById("numofkeywords").innerHTML = '' + outputKeywords.length + ' : ' + keywordsToDisplay.length;
}

function FilterIfNotWorking() {
    if (doWork == false) {
        FilterAndDisplay();
    }
}


$(document).ready(function () {
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
});
