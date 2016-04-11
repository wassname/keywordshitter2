var KWS = function(){

    return {
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

        services:suggestions.services,
        getUrl :suggestions.getUrl,
        parseServiceResponse: suggestions.parseServiceResponse,

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
                this.keywordsToQuery=_.map(ks,this.CleanVal);


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
            retList=_.map(retList,this.CleanVal);

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
            var options = this.getOptions()

            this.hashMapInputs[search] = true;

            // sort so the shortest is first in the queue TODO add option?
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
            retList=_.map(retList,this.CleanVal);

            // get permutations
            var newInputs = retList.reduce(function(result, keyword){
                return _.concat(
                    result,
                    _.map(options.prefixes,addPrefix.bind(self,keyword)),
                    _.map(options.suffixes,addSuffix.bind(self,keyword))
                );
            }, []);

            // add to queue
            this.keywordsToQuery=_.concat(this.keywordsToQuery,newInputs);

            return newInputs;
        },


        /** Display results **/
        displayResults: function(retList, search, dontDisplay, url,data){

            var rows=[];
            retList=_.map(retList,this.CleanVal);
            for (var i = 0; i < retList.length; i++) {
                var  cleanKw = retList[i];

                // url might be in retlist
                if (url===undefined) url=data[i].url;

                var da = {
                    id: this.table.rows()[0].length+i,
                    keyword: cleanKw,
                    length: cleanKw.length,
                    words: cleanKw.trim().split(/ +/).length,
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

            // search not done, lets do the query
            url = self.getUrl()+search;
            var promise = $.ajax({
                url: url,
                // jsonp: "jsonp",
                dataType: "jsonp",
                success: function (res, statusText, jqXHR) {
                    var retList = self.parseServiceResponse(res);
                    if (retList && retList.length){
                        // self.storeResults(retList, search, this.url);
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
                error: function(jqXHR,errorText,error){
                    console.error(errorText,this.url,this,jqXHR,error);
                    self.queryLock = false;
                    return;
                },
                callback: function(){
                    console.log(this,arguments);
                }
            });
            return promise;
        },

        /** Clean input, may not all be needed **/
        CleanVal: function(input) {
            // We want to clean search terms but it's not possible to do this perfectly
            // as differen't search engines strip differen't amounts from the term
            // so we will keep as much details as possible

            // Search engines are sensitive to whitespace so we do not want to trim
            // Some return html or escaped html, so we do want to convert to text

            // removed escaped html and html tags
            // e.g. '<b>A&amp;M</b>' => 'A&M'
            input=$('<div />').html(input).text();

            // I don't know of any search engines sentitive or case so make all lowercase
            input = input.toLowerCase();

            // this removes navigation suggestions, perhaps we need to move this to result parser
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
            // Tabe settings are auto handles by datatables
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
            // this.setUpDb();

            // add this.servicess to search engine settings
            for (var service in this.services) {
                if (this.services.hasOwnProperty(service)) {
                    $('#service').append('<option>'+service+'</option>')
                }
            }


            this.loadSettings();
            this.options = this.getOptions();

            window.setInterval(this.DoJob.bind(this), this.options.rateLimit);

            $('#progress1').addClass('progressjs-progress');
            this.progress1 = progressJs("#progress1");

            // bind buttons
            $('#startjob').on('click',this.toggleWork.bind(this));
            $('#reset').on('click',this.reset.bind(this));

            // setup table
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
                                //  'customize': function(data,options){
                                //      console.log(data,options);return data.split('\n').join(',');
                                //  },
                                 header: false,
                                 exportOptions: {
                                     stripNewlines: true,
                                     stripHtml: true,
                                     decodeEntities: true,
                                     columns: 1,
                                    //  format:{
                                    //      body: function(html,i){
                                    //          console.log(html);return html
                                    //      }
                                    //  }
                                 }
                             },
                             {
                                 extend: 'csvHtml5',
                                 fieldBoundary: "",
                                 text: 'Copy visible columns',
                                 header: false,
                                 exportOptions: {
                                     columns: ':visible',
                                     stripNewlines: true,
                                     stripHtml: true,
                                     decodeEntities: true,
                                 }
                             },
                         ]
                     },

                ],
                "columnDefs": [
                {
                    "title": "id",
                    "data": "id",
                    "targets": 0,
                    "visible": false,
                }, {
                    "name": "keyword",
                    "title": "Keyword",
                    "data": "keyword",
                    "responsivePriority": 1,
                    "targets": 1,
                }, {
                    "title": "Length",
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
                    "title": "CPC",
                    "data": "cpc",
                    "targets": 4,
                    "visible": false,
                    "type": "num"
                }, {
                    "title": "Search",
                    "data": "search",
                    "responsivePriority": 3,
                    "targets": 5,
                    "visible": false,
                }, {
                    "title": "Domain",
                    "data": "domain",
                    "responsivePriority": 2,
                    "targets": 6,
                    "visible": false,
                }, {
                    "title": "Words",
                    "data": "words",
                    "targets": 7,
                    "visible": false,
                    "type": "num"
                },
            ],
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

            // get user ip
            $.getJSON('https://api.ipify.org?format=json', function (data) {
                this.myIp = data.ip;
            });

        }
    };
}();
