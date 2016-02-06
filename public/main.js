var keywordsToDisplay = new Array();
var hashMapResults = {};
var numOfInitialKeywords = 0;
var doWork = false;
var keywordsToQuery = new Array();
var keywordsToQueryIndex = 0;
var queryflag = false;
var table;

window.setInterval(DoJob, 750);

function StartJob() {
    if (doWork == false) {
        keywordsToDisplay = new Array();
        hashMapResults = {};
        keywordsToQuery = new Array();
        keywordsToQueryIndex = 0;

        hashMapResults[""] = 1;
        hashMapResults[" "] = 1;
        hashMapResults["  "] = 1;

        var ks = $('#input').val().split("\n");
        var i = 0;
        for (i = 0; i < ks.length; i++) {
            keywordsToQuery[keywordsToQuery.length] = {Keyword: ks[i]};
            keywordsToDisplay[keywordsToDisplay.length]= {Keyword: ks[i]};

            var j = 0;
            for (j = 0; j < 26; j++) {
                var chr = String.fromCharCode(97 + j);
                var currentx = ks[i] + ' ' + chr;
                keywordsToQuery[keywordsToQuery.length] = {Keyword: currentx};
                hashMapResults[currentx] = 1;
            }
        }
        //document.getElementById("input").value = '';
        //document.getElementById("input").value += "\n";
        numOfInitialKeywords = keywordsToDisplay.length;
        FilterAndDisplay();

        doWork = true;
        $('#startjob').val('Stop Job').text('Stop Job').addClass('btn-danger');

    } else {
        doWork = false;
        alertify.alert("Stopped");
        $('#startjob').val('Start Job').text('Start Job').removeClass('btn-danger');
    }
}

function DoJob() {
    if (doWork == true && queryflag == false) {
        if (keywordsToQueryIndex < keywordsToQuery.length) {
            var currentKw = keywordsToQuery[keywordsToQueryIndex].Keyword;
            QueryKeyword(currentKw);
            keywordsToQueryIndex++;
        } else {
            if (numOfInitialKeywords != keywordsToDisplay.length) {
                alertify.alert("Done");
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
        success: function (res) {
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
                    var cleanKw =  CleanVal(retList[i]);
                    keywordsToDisplay[keywordsToDisplay.length] = {Keyword:cleanKw};
                    table.row.add([keywordsToDisplay.length,cleanKw,cleanKw.length]).draw( false );

                    keywordsToQuery[keywordsToQuery.length] = {Keyword: currents};

                    var prefixes = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'y', 'x', 'y', 'z', 'how', 'which', 'why', 'where', 'who', 'when', 'are', 'what'];
                    var suffixes = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'y', 'x', 'y', 'z', 'like', 'for', 'without', 'with', 'verses', 'to', 'near', 'except'];

                    for (var k = 0; k < prefixes.length; k++) {
                        var chr = prefixes[k];
                        var currentx = chr + ' ' + currents;
                        keywordsToQuery[keywordsToQuery.length] = {Keyword: currentx};
                        hashMapResults[currentx] = 1;
                    }
                    for (var j = 0; j < prefixes.length; j++) {
                        var chr = prefixes[j];
                        var currentx = currents + ' ' + chr;
                        keywordsToQuery[keywordsToQuery.length] = {Keyword: currentx};
                        hashMapResults[currentx] = 1;
                    }
                }
            }
            table.draw();
            FilterAndDisplay();
            var textarea = document.getElementById("input");
            textarea.scrollTop = textarea.scrollHeight;
            queryflag = false;
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
            var currentKeyword = retList[i];
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
                filteredList[filteredList.length] = currentKeyword;
            }
        }

        retList = filteredList;
    }

    if (document.getElementById("filter-negative").value.length > 0) {
        var filteredList = new Array();
        var filterContains = document.getElementById("filter-negative").value.split("\n");
        var i = 0;
        for (i = 0; i < retList.length; i++) {
            var currentKeyword = retList[i];
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
    var outputKeywords = Filter(keywordsToDisplay);
    for (i = 0; i < outputKeywords.length; i++) {
        sb += outputKeywords[i].Keyword;
        sb += '\n';
    }

    document.getElementById("input").value = sb;
    document.getElementById("numofkeywords").innerHTML = '' + outputKeywords.length + ' : ' + keywordsToDisplay.length;
}

function FilterIfNotWorking() {
    if (doWork == false) {
        FilterAndDisplay();
    }
}

function post_to_url(path, params, method) {
    method = method || "post"; // Set method to post by default, if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}

function Download() {
    var inputText = document.getElementById("input").value;
    post_to_url('KSDownload.php', {
        'input_text': inputText
    }, 'post');
}

$(document).ready(function() {
    table = $('#outtable').DataTable({
        //  "dom": '<"top"iflp<"clear">>rt<"bottom"ipB<"clear">>',
        //   responsive: true,
          pageLength: 25,
        //   bAutoWidth: false,
        //   dom: 'lfrtipB',
          dom: "<'row'<'col-sm-3'B><'col-sm-6'p><'col-sm-3'f>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-4'i><'col-sm-5'p><'col-sm-3'l>>",
          buttons: ['copyHtml5','csvHtml5']
        //   aaSorting: [],
        // data: keywordsToDisplay
    });
} );
