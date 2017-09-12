var suggestions = function(){
    return {
        defaultOptions:{
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
        },

        services:{
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
            "http://completion.amazon.co.uk/search/complete?method=completion&search-alias=aps&mkt=3&callback=?&q=",
            "twitter":
            "https://twitter.com/i/search/typeahead.json?count=30&result_type=topics&src=SEARCH_BOX&callback=?&q=",
            "baidu": "http://suggestion.baidu.com/su?cb=?&wd=",
            "yandex": "https://yandex.com/suggest/suggest-ya.cgi?callback=?&q=?&n=30&v=4&uil={lang}&part=",
            "google play": "https://market.android.com/suggest/SuggRequest?json=1&c=0&hl=${lang}&gl=${country}&callback=?&query=", //
            "google play apps": "https://market.android.com/suggest/SuggRequest?json=1&c=3&hl=${lang}&gl=${country}&callback=?&query=",
            "google play movies": "https://market.android.com/suggest/SuggRequest?json=1&c=4&hl=${lang}&gl=${country}&callback=?&query=",
            "google play books": "https://market.android.com/suggest/SuggRequest?json=1&c=1&hl=${lang}&gl=${country}&callback=?&query=",
            // "kickasstorrents": "https://kat.cr/get_queries.php?query=", // not jsonp
        },
        /**
         * Get the service url based on options set in the dom.
         * @return {String} A jsonp url for search suggestions with query missing from the end.
         */
        getUrl :function(service, options){
            // Ref: https://github.com/estivo/Instantfox/blob/master/firefox/c1hrome/content/defaultPluginList.js
            // Ref: https://github.com/bnoordhuis/mozilla-central/tree/master/browser/locales/en-US/searchplugins
            // Ref: https://developers.google.com/custom-search/json-api/v1/reference/cse/list
            // https://developers.google.com/custom-search/docs/ref_languages
            options = _.defaults({},this.defaultOptions, this.getOptions(), options)
            return _.template(this.services[(service||this.options.service)])(options);
        },


        /** Parse response per service **/
        parseServiceResponse: function(res, service){
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
                "linkedin": function(res){
                    return _.map(res.resultList,'displayName');
                },
                "google play": function(res){return _.map(res,'s')},
                "google play apps": function(res){return _.map(res,'s')},
                "google play movies": function(res){return _.map(res,'s')},
                "google play books": function(res){return _.map(res,'s')},
            };
            var parser = RESPONSE_TEMPLATES[(service||this.options.service)] || RESPONSE_TEMPLATES["default"];
            return parser(res);
        }
    }
}()
