var KWS = function(){

    return {
        db:undefined,
        table: undefined,
        myIp: undefined,
        options: {},
        // flags
        queryLock: false,
        doWork: false,
        // keeping track of queue
        hashMapInputs: {},
        keywordsToQuery: [],
        keywordsToQueryIndex: 0,
        numOfInitialKeywords: 0,
        /**
         * Get the service url based on options set in the dom.
         * @return {String} A jsonp url for search suggestions with query missing from the end.
         */
        getUrl :function(){
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

            return _.template(services[this.options.service])(this.options);
        },


        /** Parse response per service **/
        parseServiceResponse: function(res){
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
                    return res.res ? res.res.sug : [];
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
            var parser = RESPONSE_TEMPLATES[this.options.service] || RESPONSE_TEMPLATES["default"];
            return parser(res);
        },

        setUpDb: function(success){
            var self=this;
            // setup a db. Ref: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
            var dbReq = window.indexedDB.open("KeywordShitter2", 3);
            /** Error handler for all child transactions as events bubbe up **/
            dbReq.onerror = function (event) {
                return console.error('Error opening indexedDB database KeywordShitter2', event);
            };
            dbReq.onsuccess = function (event) {
                self.db = event.target.result;
                self.db.onerror = function (event) {
                    // Generic error handler requests
                    if (event && event.target && event.target.error)
                        console.error("Database error",event.target.error.errorCode, event.target.error.message, event);
                    else
                        console.error("Database error",arguments);
                    return this;
                };
                if (success) success(self.db,dbReq);
                return self.db;
            };
            dbReq.onupgradeneeded = function (event) {
                console.log("running onupgradeneeded");
                self.db = event.target.result;

                if (!self.db.objectStoreNames.contains("suggestions")) {
                    var objectStore = self.db.createObjectStore("suggestions", {
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

                return self.db;
            };
            return dbReq;
        },

        toggleWork: function(){
            if (this.doWork === false)
                this.StartWork();
            else
                this.StopWork();
        },

        StartWork: function() {
            if (this.doWork === false) {
                // reset these
                this.saveSettings();
                $('#startjob').val('Stop Job').text('Stop shitting').addClass('btn-danger');
                this.hashMapInputs = {};
                this.keywordsToQuery = [];
                this.keywordsToQueryIndex = 0;

                this.hashMapInputs[""] = true;
                this.hashMapInputs[" "] = true;
                this.hashMapInputs["  "] = true;

                // update config
                this.options = this.getOptions();

                // get queries from the input
                var ks = $('#input').val().split("\n");
                this.keywordsToQuery=ks.map(this.CleanVal);


                // add variations of the initial terms
                // (before we start adding variations of the results)
                if (!this.keywordsToQuery.length)
                    this.permuteResultsToQueue([' ']);
                else {
                    var untickedInputs = this.keywordsToQuery.filter(function(k){
                        return k.slice(-1)!=='✓' && k.slice(-1)!=='❌';
                    });
                    this.permuteResultsToQueue(untickedInputs);
                }

                this.numOfInitialKeywords = this.keywordsToQuery.length;
                // show the extended queue
                this.FilterAndDisplay();

                this.doWork = true;
                this.progress1.start();

                // $('#input').hide();
                // $('#advanced').collapse("hide");

            } else {

            }
        },

        StopWork: function(){
            if (this.doWork){
                $('#startjob').val('Start Job').text('Start shitting').removeClass('btn-danger');
                this.doWork = false;
                // $('#input').show();
                this.table.draw();
                this.table.columns.adjust();
                this.saveSettings();
                this.FilterAndDisplay();
                this.progress1.end();
            }
        },

        DoJob: function() {
            if (this.doWork === true && this.queryLock === false) {
                if (this.keywordsToQueryIndex < this.numOfInitialKeywords) {
                    var currentKw = this.keywordsToQuery[this.keywordsToQueryIndex];
                    if (currentKw.slice(-1)!=='✓' && currentKw.slice(-1)!=='❌') {
                        this.QueryKeyword(currentKw);
                        this.keywordsToQueryIndex++;
                    } else {
                        // we didn't do a query immediatly go to next query
                        this.keywordsToQueryIndex++;
                        this.DoJob();
                    }

                    var prog = parseInt(this.keywordsToQueryIndex/this.numOfInitialKeywords*100);
                    this.progress1.set(prog);
                    this.FilterAndDisplay();

                } else {
                    if (this.options.keepRunning) {
                        console.log('finish initial queue');
                        this.StopWork();
                        this.StartWork();
                    } else {
                        console.log('finish initial queue');
                        this.StopWork();
                    }
                }
            }
        },

        addResultsToQueue: function(retList, search){
            retList=retList.map(this.CleanVal);

            // add each result to list first before permutations
            for (var j = 0; j < retList.length; j++) {
                cleanKw = retList[j];
                // add base suggestion to queue if it's not already done and isn't empty
                if (cleanKw && cleanKw.length && !this.hashMapInputs[cleanKw] && this.keywordsToQuery.indexOf(cleanKw)===-1)
                    this.keywordsToQuery.push(cleanKw);
                this.hashMapInputs[cleanKw] = true;
            }

        },

        /** Make permutations of results and add to queue **/
        permuteResultsToQueue: function(retList, search){
            var chr, currentx, currentKw;
            var self = this;

            this.hashMapInputs[search] = true;

            // sort so the shortest is first in the queue
            // retList.sort(function (a, b) {
            //   return a.length - b.length;
            // });

            function addPrefix(s,prefix){
                return prefix+' '+s;
            }
            function addSuffix(s,suffix){
                return s+' '+suffix;
            }
            // clean
            retList=retList.map(this.CleanVal);





            // get permutations
            var newInputs = retList.reduce(function(result, keyword){
                return _.concat(
                    result,
                    self.options.prefixes.map(addPrefix.bind(self,keyword)),
                    self.options.suffixes.map(addSuffix.bind(self,keyword))
                );
            }, []);

            // add to queue
            this.keywordsToQuery=_.concat(this.keywordsToQuery,newInputs);

            return newInputs;
        },

        /** export db as json **/
        exportDB: function(success){
            var reqObj = this.db.transaction(["suggestions"],"readonly")
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
                        if (success instanceof Function) success(blob);
                    }
                    return blob;
                };
                return reqObj;
        },

        clearDB: function(){
            this.db.transaction(["suggestions"], "readwrite")
                .objectStore("suggestions")
                .clear();
            console.warn('cleared all indexedDB data');
        },

        /** Display data from db upon pressing load button **/
        loadFromDB: function(){
            var self = this;
            var reqObj = this.db.transaction(["suggestions"],"readonly")
                .objectStore("suggestions")
                .getAll()
                .onsuccess = function(e) {
                    if (e.target.result.length){
                        /// grab the fields we want
                        var data =[];
                        for (var i = 0; i < e.target.result.length; i++) {
                            var da = e.target.result[i];

                            // also remove undefined so datatables doesn't bring up alerts
                            da = _.mapValues(da, function(v){return v===undefined ? null: v;});

                            // parse nums
                            // da = da.map(v => /^[\d+\.]+$/.test(v) ? Number(v): v);
                            //
                            data.push(da);
                        }
                        self.table.rows.add(data);
                        return self.table.draw(false);
                    }
                };
                return;
        },

        /** Display results **/
        displayResults: function(retList, search, dontDisplay, url,data){

            var rows=[];
            retList=retList.map(this.CleanVal);
            for (var i = 0; i < retList.length; i++) {
                var  cleanKw = retList[i];

                // url might be in retlist
                if (url===undefined) url=data[i].url;
                //
                // var da = [
                //     this.table.rows()[0].length+i,
                //     cleanKw,
                //     cleanKw.length,
                //     null,
                //     null,
                //     search,
                //     this.extractDomain(url)
                //     ];
                var da = {
                    id: this.table.rows()[0].length+i,
                    keyword: cleanKw,
                    length: cleanKw.length,
                    volume: null,
                    cpc: null,
                    search: search,
                    domain: this.extractDomain(url)
                };

                // remove undefined values to avoid datatable alerts
                da = _.mapValues(da, function(v){return v===undefined ? null: v;});

                // TODO Check if suggestion is already displayed before adding
                // var matches = table.data().filter(function(v){return v[1]===cleanKw && v[5]==search;}).count();
                // if (!matches)
                rows.push(da);
            }
            this.table.rows.add(rows);
            // if table is large lets defer rending to end to speed it up
            if (!dontDisplay && this.table.data().length<this.options.deferTableUpdatesAtRows) this.table.draw(false);
        },

        /** Takes url string and returns domain e.g. www.google.com or google.com
          * and some extra params to identify is
          **/
        extractDomain: function(url) {
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
        },

        /** Store new results in db and hashmap **/
        storeResults: function(retList, search, url){
            var self = this;
            retList=retList.map(this.CleanVal);

            // We will add the items async in order
            // Ref: http://stackoverflow.com/a/13666741/221742
            var transaction = this.db.transaction(["suggestions"], "readwrite");
            var store = transaction.objectStore("suggestions");
            var i=0;
            addNext();

            /** Like an async for loop to add each to db **/
            function addNext() {
                if (i<retList.length) {
                        var cleanKw = retList[i];
                        if (cleanKw.length){
                        addReq = store.add({
                            keyword: cleanKw,
                            length: cleanKw.length,
                            search: search,
                            ip: this.myIp,
                            url: url,
                            domain: self.extractDomain(url),
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

        },

        /** mark a search as done in the queue **/
        markAsDone: function(search){
            // mark as done in queue
            if (this.keywordsToQuery[this.keywordsToQueryIndex]===search)
                this.keywordsToQuery[this.keywordsToQueryIndex]+=' ✓';
            else if (this.keywordsToQuery[this.keywordsToQueryIndex-1]===search)
                this.keywordsToQuery[this.keywordsToQueryIndex-1]+=' ✓';
            else
                console.warn('Cant find ',search,'in keywordsToQuery');
        },

        /** mark a search as done in the queue **/
        markAsNone: function(search){
            // mark as done in queue
            if (this.keywordsToQuery[this.keywordsToQueryIndex]===search)
                this.keywordsToQuery[this.keywordsToQueryIndex]+=' ❌';
            else if (this.keywordsToQuery[this.keywordsToQueryIndex-1]===search)
                this.keywordsToQuery[this.keywordsToQueryIndex-1]+=' ❌';
            else
                console.warn('Cant find ',search,'in keywordsToQuery');
        },

        /** Get search suggestions for a keyword **/
        QueryKeyword: function(search) {
            var self = this;
            this.queryLock = true;

            // first check in db
            var reqObj = this.db.transaction(["suggestions"],"readonly")
                .objectStore("suggestions")
                .index("search")
                .getAll(search);
            reqObj.onsuccess = function(e) {
                    var domain = self.extractDomain(self.getUrl());
                    var results = e.target.result.filter(function(r){return r.domain==domain;});
                    // console.log(e.target.result);
                    if (results.length){
                        // search was done previously so display results from db
                        var retList=_.map(results,'keyword');
                        self.markAsDone(search);
                        self.displayResults(retList,search,undefined,undefined,results);
                        self.addResultsToQueue(retList);
                        if (self.options.keepRunning) self.permuteResultsToQueue(retList);
                        self.queryLock = false;
                    }
                    else {
                        // search not done, lets do the query
                        url = self.getUrl()+search;
                        $.ajax({
                            url: url,
                            jsonp: "jsonp",
                            dataType: "jsonp",
                            success: function (res, statusText, jqXHR) {

                                var retList = self.parseServiceResponse(res);
                                var char, currentx;
                                if (retList && retList.length){
                                    self.storeResults(retList, search, this.url);
                                    self.displayResults(retList, search, undefined, this.url);
                                    self.addResultsToQueue(retList);
                                    if (self.options.keepRunning) self.permuteResultsToQueue(retList);
                                    self.markAsDone(search);
                                } else {
                                    // console.debug('No suggestions for query: "',search,'"');
                                    self.markAsNone(search);
                                }
                                self.queryLock = false;
                                return;

                            },
                            error: function(e){
                                console.error(e);
                                self.queryLock = false;
                                return;
                            }
                        });
                    }
                };
                return reqObj;
        },

        /** Clean input, may not all be needed **/
        CleanVal: function(input) {

            function escapeHtml(unsafe) {
                return unsafe
                     .replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/"/g, "&quot;")
                     .replace(/'/g, "&#039;");
             }

            // google returns lowercase
            input = input.toLowerCase();
            input = escapeHtml(input);

            // not sure if we want to trim, the search engines are sensitive to
            // whitespace. (and also last search)
            // input = input.trim();

            // this removes navigation suggestions
            if (input.length > 4 && input.substring(0, 4) == "http") input = "";
            return input;
        },

        /** TODO get this working **/
        Filter: function(listToFilter) {
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
                for (var l = 0; l < retList.length; l++) {
                    var currentKeyword = retList[l];
                    var boolCleanKeyword = true;
                    for (var k = 0; k < filterContains.length; k++) {
                        if (filterContains[k].length > 0) {
                            if (currentKeyword.indexOf(filterContains[k]) >= 0) {
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
        },

        /** display the queue, and update description of it **/
        FilterAndDisplay: function() {
            var i = 0;
            var sb = '';

            var outputKeywords = this.keywordsToQuery;
            for (i = 0; i < Math.min(outputKeywords.length,this.options.maxQueueDisplay); i++) {
                sb += outputKeywords[i];
                sb += '\n';
            }
            if (outputKeywords.length>this.options.maxQueueDisplay) sb+='...\n';
            $("#input").val(sb);
            $("#numofkeywords").html('Queue:' + outputKeywords.length);
        },


        /** overrides default with dom options with arguments options **/
        getOptions: function(argOptions){
            var defaultOptions={
                deferTableUpdatesAtRows: 5000,
                keepRunning: false,
                maxQueueDisplay: 5000,
                country: "",
                filterNegative: "",
                filterPositive: "",
                lang: "",
                prefixes: [" ", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "y", "x", "y", "z", "how", "which", "why", "where", "who", "when", "are", "what"],
                rateLimit: 750,
                service: "google",
                suffixes: [" ", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "y", "x", "y", "z", "like", "for", "without", "with", "versus", "vs", "to", "near", "except", "has"]
            }; // for now defaults are set in html
            if (argOptions===undefined) argOptions={};
            return _.defaults(argOptions,this.getDomOptions(),defaultOptions);
        },

        /** read settings from webpage **/
        getDomOptions: function(){

            var service= $('#service').val(),
                filterNegative = $('#filter-negative').val(),
                filterPositive = $('#filter-positive').val(),
                rateLimit = parseInt($('#rate-limit').val()),
                // input: $('#input').val(),
                prefixes = $('#prefixes').val(),
                suffixes = $('#suffixes').val(),
                country = $('#country').val(),
                lang = $('#lang').val(),
                keepRunning = $('#keep-running').prop('checked');
            if (prefixes && prefixes.length)
                prefixes=prefixes.split(',');
            else
                prefixes=undefined;
            if (suffixes && suffixes.length)
                suffixes=suffixes.split(',');
            else
                suffixes=undefined;

            var options={};
            if (service) options.service=service;
            if (filterNegative) options.filterNegative=filterNegative;
            if (filterPositive) ooptions.filterPositive=filterPositive;
            if (rateLimit) options.rateLimit=rateLimit;
            if (prefixes) options.prefixes=prefixes;
            if (suffixes) options.suffixes=suffixes;
            if (country) options.country=country;
            if (lang) options.lang=lang;
            if (keepRunning) options.keepRunning=keepRunning;
            return options;
        },

        /** load settings from localStorage **/
        loadSettings: function(){
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
            if (localStorage.keepRunning) $('#keep-running').prop('checked',localStorage.keepRunning=="true");

        },
        /** save settings to localStorage. **/
        saveSettings: function(){
            localStorage.service = $('#service').val();
            localStorage.country = $('#country').val();
            localStorage.lang = $('#lang').val();
            localStorage.filterNegative = $('#filter-negative').val();
            localStorage.filterPositive = $('#filter-positive').val();
            localStorage.rateLimit = $('#rate-limit').val();
            localStorage.input = $('#input').val();
            localStorage.prefixes = $('#prefixes').val();
            localStorage.suffixes = $('#suffixes').val();
            localStorage.keepRunning = $('#keep-running').prop('checked');
        },

        /** reset inputs and results, but not settings **/
        reset: function(){
            this.table.clear();
            this.table.draw();
            $('#input').val('');
            this.saveSettings();
        },

        init: function(){
            this.setUpDb();
            this.loadSettings();
            this.options = this.getOptions();

            window.setInterval(this.DoJob.bind(this), this.options.rateLimit);

            $('#progress1').addClass('progressjs-progress');
            this.progress1 = progressJs("#progress1");


            $('#startjob').on('click',this.toggleWork.bind(this));
            $('#reset').on('click',this.reset.bind(this));
            $('#load-from-cache').on('click',this.loadFromDB.bind(this));
            $('#export-from-cache').on('click',this.exportDB.bind(this));
            $('#clear-cache').on('click',this.clearDB.bind(this));
            // $('#filter-positive').on('click',this.FilterIfNotWorking.bind(this));
            // $('#filter-negative').on('click',this.FilterIfNotWorking.bind(this));


            this.table = $('#outtable').DataTable({
                pageLength: 25,
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
                         ]
                     },

                ],
                "columnDefs": [
                {
                    "name": "id",
                    "data": "id",
                    "targets": 0,
                    "visible": false,
                }, {
                    "name": "keyword",
                    "data": "keyword",
                    "responsivePriority": 1,
                    "targets": 1,
                }, {
                    "name": "length",
                    "data": "length",
                    "targets": 2,
                    "visible": false,
                    "type": "num"
                }, {
                    "name": "volume",
                    "data": "volume",
                    "targets": 3,
                    "visible": false,
                    "type": "num"
                }, {
                    "name": "cpc",
                    "data": "cpc",
                    "targets": 4,
                    "visible": false,
                    "type": "num"
                }, {
                    "name": "search",
                    "data": "search",
                    "responsivePriority": 3,
                    "targets": 5,
                    "visible": false,
                }, {
                    "name": "domain",
                    "data": "domain",
                    "responsivePriority": 2,
                    "targets": 6,
                    "visible": false,
                }],
                order: [[ 0, 'desc' ]],
                // colReorder: {},
                stateSave: true,
                "bDeferRender": true,
                // fixedHeader: true,
                //  responsive: {
                //     details: {
                //         type: 'column',
                //         target: 'tr'
                //     },
                // },
                // scrollY:        500,
                // deferRender:    true,
                // scroller:       true
            });

            $.getJSON('https://api.ipify.org?format=json', function (data) {
                this.myIp = data.ip;
            });

        }
    };
}();
