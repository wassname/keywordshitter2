var testData = function () {
    return {
        domainUrls: {
            "api.bing.com": "http://api.bing.com/osjson.aspx?JsonType=callback&JsonCallback=jQuery111&query=a  &_=11111",
            "autosug.ebay.com": "http://autosug.ebay.com/autosug?_jgr=1&sId=0&_ch=0&callback=jQuery111&kwd=a  &_=11111",
            "completion.amazon.co.uk": "http://completion.amazon.co.uk/search/complete?method=completion&search-alias=aps&mkt=4&callback=jQuery111&q=a  &_=11111",
            "search.yahoo.com": "https://search.yahoo.com/sugg/ff?output=jsonp&appid=ffd&callback=jQuery111&command=a  &_=11111",
            "suggestqueries.google.com&gl=US&hl=en": "http://suggestqueries.google.com/complete/search?client=chrome&hl=en&gl=US&callback=jQuery111&q=a  &_=11111",
            "suggestqueries.google.com&ds=i&gl=US&hl=en": "http://suggestqueries.google.com/complete/search?client=chrome&hl=en&ds=i&gl=US&callback=jQuery111&q=a  &_=11111",
            "suggestqueries.google.com&ds=sh&gl=US&hl=en": "http://suggestqueries.google.com/complete/search?client=chrome&hl=en&ds=sh&gl=US&callback=jQuery111&q=a  &_=11111",
            "suggestqueries.google.com&ds=yt&gl=US&hl=en": "http://suggestqueries.google.com/complete/search?client=chrome&hl=en&ds=yt&gl=US&callback=jQuery111&q=a  &_=11111",
            "suggestqueries.google.com&gl=us&hl=en": "http://suggestqueries.google.com/complete/search?client=chrome&hl=en&gl=us&callback=jQuery111&q=oil&_=11111",
            "suggestqueries.google.com&gl=us&hl=fi": "http://suggestqueries.google.com/complete/search?client=chrome&hl=fi&gl=us&callback=jQuery111&q=a  &_=11111",
            "suggestqueries.google.com&gl=us&hl=he": "http://suggestqueries.google.com/complete/search?client=chrome&hl=he&gl=us&callback=jQuery111&q=a  &_=11111",
            "suggestqueries.google.combo": "http://suggestqueries.google.com/complete/search?client=chrome&hl=en&ds=bo&gl=US&callback=jQuery111&q=a  &_=11111",
            "twitter.com": "https://twitter.com/i/search/typeahead.json?count=30&result_type=topics&src=SEARCH_BOX&callback=jQuery111&q=I accidentally&_=11111"
        },
        responses: {
            "linkedin": {
                "resultList": [{
                    "sourceID": "sitefeature",
                    "displayName": "Where is the Answers feature?",
                    "subLine": "",
                    "rank": 0,
                    "id": "162",
                    "url": "http://help.linkedin.com/app/answers/global/id/35227/trk/search-typeahead",
                    "headLine": "<strong>Where<\/strong> is the Answers feature?"
                }, {
                    "sourceID": "sitefeature",
                    "displayName": "Where are the &quot;Settings&quot; and &quot;Sign Out&quot; links on my homepage?",
                    "subLine": "",
                    "rank": 1,
                    "id": "205",
                    "url": "http://help.linkedin.com/app/answers/global/id/4642/trk/search-typeahead",
                    "headLine": "<strong>Where<\/strong> are the &quot;Settings&quot; and &quot;Sign Out&quot; links on my homepage?"
                }]
            },
            "yahoo": {
                "gossip": {
                    "qry": "where",
                    "gprid": "xfbzDJDaR9yN9o2B4J0JBA",
                    "results": [{
                        "key": "where's my refund",
                        "mrk": 6
                    }, {
                        "key": "where is super bowl 2016",
                        "mrk": 6
                    }, {
                        "key": "where's my refund 2016",
                        "mrk": 6
                    }, {
                        "key": "where the wild things are",
                        "mrk": 6
                    }, {
                        "key": "wheresgeorge.com",
                        "mrk": 5
                    }, {
                        "key": "where's waldo",
                        "mrk": 6
                    }, {
                        "key": "where to get a passport",
                        "mrk": 6
                    }, {
                        "key": "where the red fern grows",
                        "mrk": 6
                    }, {
                        "key": "where can i watch movies online for free",
                        "mrk": 6
                    }, {
                        "key": "where are they now",
                        "mrk": 6
                    }]
                }
            },
            "google": ["where", ["where's my refund", "where am i", "http://www.irs.gov/individuals/article/0,,id=96596,00.html", "where is xur", "where is oj simpson now", "where is the next primary", "where to invade next", "where the wild things are", "where are you now", "where is dubai", "where is potomac", "where's waldo", "where is my phone", "where the heart is", "where the red fern grows", "where is the zika virus", "where was ted cruz born", "where is oak island", "where are you christmas", "where ya at"],
                ["", "", "Where's My Refund - It's Quick, Easy, and Secure.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                [], {
                    "google:clientdata": {
                        "bpc": false,
                        "tlw": false
                    },
                    "google:suggestrelevance": [1250, 602, 601, 600, 565, 564, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550],
                    "google:suggesttype": ["QUERY", "QUERY", "NAVIGATION", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY"],
                    "google:verbatimrelevance": 851
                }
            ],
            "google news": ["where", ["where is mali", "http://www.irs.gov/individuals/article/0,,id=96596,00.html", "where is isis", "where is xur", "where is john cena", "where is ronda rousey", "where is isis now", "where is san bernardino", "where is luke skywalker", "where am i", "where she went movie", "where is josh duggar now", "where is el nino", "where is reid on criminal minds", "where will isis attack next", "where is isis located", "where is frank ocean", "where the hoes at", "where is spencer on criminal minds", "where is syria"],
                ["", "Where's My Refund - It's Quick, Easy, and Secure.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                [], {
                    "google:clientdata": {
                        "bpc": false,
                        "tlw": false
                    },
                    "google:suggestrelevance": [602, 601, 600, 566, 565, 564, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550],
                    "google:suggesttype": ["QUERY", "NAVIGATION", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY"],
                    "google:verbatimrelevance": 851
                }
            ],
            "google books": ["where", ["where the red fern grows", "http://www.irs.gov/individuals/article/0,,id=96596,00.html", "where the wild things are", "where she went", "where was this book published", "where the sidewalk ends", "where rainbows end", "where am i", "where are you going where have you been", "wherever you go there you are", "where to buy", "where the red fern grows book", "where the mountain meets the moon", "where can i buy this book", "where the mind is without fear", "where is mali", "where good ideas come from", "where'd you go bernadette", "where's waldo", "whereas"],
                ["", "Where's My Refund - It's Quick, Easy, and Secure.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                [], {
                    "google:clientdata": {
                        "bpc": false,
                        "tlw": false
                    },
                    "google:suggestrelevance": [602, 601, 600, 566, 565, 564, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550],
                    "google:suggesttype": ["QUERY", "NAVIGATION", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY"],
                    "google:verbatimrelevance": 851
                }
            ],
            "youtube": ["where", ["where are you now justin bieber", "where ya at future", "http://www.irs.gov/individuals/article/0,,id=96596,00.html", "where are you christmas", "where is the love", "where are you christmas faith hill", "where do the good boys go to hideaway", "where is my mind", "where they from", "where the hood at", "where are you now justin bieber lyrics", "where ya at future lyrics", "where is the love black eyed peas lyrics", "where have you been rihanna", "where is my mind piano", "wheresmychallenge", "wherever you will go the calling", "where you at", "where they at doe", "where them girls at"],
                ["", "", "Where's My Refund - It's Quick, Easy, and Secure.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                [], {
                    "google:clientdata": {
                        "bpc": false,
                        "tlw": false
                    },
                    "google:suggestrelevance": [950, 602, 601, 600, 565, 564, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550],
                    "google:suggesttype": ["QUERY", "QUERY", "NAVIGATION", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY"],
                    "google:verbatimrelevance": 851
                }
            ],
            "bing": ["where", ["whereis", "where is", "whereis.com.au", "where is maps directions", "whereis nsw", "whereis.com", "where is santa", "whereis maps", "where is it", "where am i", "whereis.com.au directions", "where is.com.au"]],
            "google videos": ["where", ["where are you now justin bieber", "where ya at future", "http://www.irs.gov/individuals/article/0,,id=96596,00.html", "where are you christmas", "where is the love", "where are you christmas faith hill", "where do the good boys go to hideaway", "where is my mind", "where they from", "where the hood at", "where are you now justin bieber lyrics", "where ya at future lyrics", "where is the love black eyed peas lyrics", "where have you been rihanna", "where is my mind piano", "wheresmychallenge", "wherever you will go the calling", "where you at", "where they at doe", "where them girls at"],
                ["", "", "Where's My Refund - It's Quick, Easy, and Secure.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                [], {
                    "google:clientdata": {
                        "bpc": false,
                        "tlw": false
                    },
                    "google:suggestrelevance": [950, 602, 601, 600, 565, 564, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550],
                    "google:suggesttype": ["QUERY", "QUERY", "NAVIGATION", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY"],
                    "google:verbatimrelevance": 851
                }
            ],
            "google shopping": ["where", ["where to buy elf on the shelf", "http://www.irs.gov/individuals/article/0,,id=96596,00.html", "where to buy cards against humanity", "where to buy essential oils", "where to buy bean boozled", "where to buy hoverboard", "where the wild things are", "where to buy citric acid", "where to buy mistletoe", "where can i buy a hoverboard", "where can you buy bean boozled", "where to buy ugly christmas sweater", "where can i buy a lokai bracelet", "where can i buy elf on the shelf", "where to buy beard oil", "where can i buy mercer's wine ice cream", "where's waldo", "where in the world is carmen sandiego", "where the red fern grows", "where to buy garcinia cambogia"],
                ["", "Where's My Refund - It's Quick, Easy, and Secure.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                [], {
                    "google:clientdata": {
                        "bpc": false,
                        "tlw": false
                    },
                    "google:suggestrelevance": [602, 601, 600, 566, 565, 564, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550],
                    "google:suggesttype": ["QUERY", "NAVIGATION", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY"],
                    "google:verbatimrelevance": 851
                }
            ],
            "ebay": {
                "prefix": "where",
                "dict": "0",
                "res": {
                    "sug": ["where the wild things are", "where women create", "where the sidewalk ends", "where monsters dwell", "where eagles dare", "where the red fern grows", "where's waldo", "wheres mickey vera bradley", "wheres waldo book", "where the wild things are book"],
                    "categories": [
                        [1093, "Children & Young Adults"],
                        [2624, "TV, Movie & Character Toys"]
                    ],
                    "isTopQuery": false
                }
            },
            "google images": ["where", ["where's waldo", "http://www.irs.gov/individuals/article/0,,id=96596,00.html", "where the wild things are", "where is mali", "where's wally", "where to shoot a deer", "where are you", "where is your liver", "where is syria", "where the red fern grows", "where is your appendix", "where are you now", "where is isis", "where is bora bora", "where is dubai", "where is the liver", "where the sidewalk ends", "where is the liver located", "where in the world is carmen sandiego", "where's the beef"],
                ["", "Where's My Refund - It's Quick, Easy, and Secure.", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                [], {
                    "google:clientdata": {
                        "bpc": false,
                        "tlw": false
                    },
                    "google:suggestrelevance": [602, 601, 600, 566, 565, 564, 563, 562, 561, 560, 559, 558, 557, 556, 555, 554, 553, 552, 551, 550],
                    "google:suggesttype": ["QUERY", "NAVIGATION", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY", "QUERY"],
                    "google:verbatimrelevance": 851
                }
            ],
            "amazon": ["where", ["where she went", "where the wild things are", "where the trail ends", "this is where i leave you", "where is wally", "where to invade next", "where we are", "how to be parisian wherever you are", "where hope grows", "where is waldo"],
                [{
                    "nodes": [{
                        "name": "Fremdsprachige Bücher",
                        "alias": "english-books"
                    }, {
                        "name": "Kindle-Shop",
                        "alias": "digital-text"
                    }]
                }, {}, {}, {}, {}, {}, {}, {}, {}, {}],
                []
            ],
            "twitter": {
                "num_results": 30,
                "users": [],
                "topics": [{
                    "topic": "#WhereWereYou",
                    "rounded_score": 93013,
                    "tokens": [{
                        "token": "#wherewereyou"
                    }],
                    "inline": false
                }, {
                    "topic": "wherever you are",
                    "rounded_score": 75887,
                    "tokens": [{
                        "token": "wherever"
                    }, {
                        "token": "you"
                    }, {
                        "token": "are"
                    }],
                    "inline": false
                }, {
                    "topic": "where to invade next",
                    "rounded_score": 64255,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "to"
                    }, {
                        "token": "invade"
                    }, {
                        "token": "next"
                    }],
                    "inline": false
                }, {
                    "topic": "#WhereToInvadeNext",
                    "rounded_score": 64255,
                    "tokens": [{
                        "token": "#wheretoinvadenext"
                    }],
                    "inline": false
                }, {
                    "topic": "where are you now",
                    "rounded_score": 63587,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "are"
                    }, {
                        "token": "you"
                    }, {
                        "token": "now"
                    }],
                    "inline": false
                }, {
                    "topic": "#WhereDealsHappen",
                    "rounded_score": 63587,
                    "tokens": [{
                        "token": "#wheredealshappen"
                    }],
                    "inline": false
                }, {
                    "topic": "#WheresRey",
                    "rounded_score": 52917,
                    "tokens": [{
                        "token": "#wheresrey"
                    }],
                    "inline": false
                }, {
                    "topic": "where",
                    "rounded_score": 51445,
                    "tokens": [{
                        "token": "where"
                    }],
                    "inline": false
                }, {
                    "topic": "Wheres the coke baby",
                    "rounded_score": 43482,
                    "tokens": [{
                        "token": "wheres"
                    }, {
                        "token": "the"
                    }, {
                        "token": "coke"
                    }, {
                        "token": "baby"
                    }],
                    "inline": false
                }, {
                    "topic": "whereslloyd",
                    "rounded_score": 43109,
                    "tokens": [{
                        "token": "whereslloyd"
                    }],
                    "inline": false
                }, {
                    "topic": "where is my mind",
                    "rounded_score": 43074,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "is"
                    }, {
                        "token": "my"
                    }, {
                        "token": "mind"
                    }],
                    "inline": false
                }, {
                    "topic": "where do you see yourself",
                    "rounded_score": 40908,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "do"
                    }, {
                        "token": "you"
                    }, {
                        "token": "see"
                    }, {
                        "token": "yourself"
                    }],
                    "inline": false
                }, {
                    "topic": "WHERE FUTURES END",
                    "rounded_score": 40908,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "futures"
                    }, {
                        "token": "end"
                    }],
                    "inline": false
                }, {
                    "topic": "where you at",
                    "rounded_score": 40908,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "you"
                    }, {
                        "token": "at"
                    }],
                    "inline": false
                }, {
                    "topic": "WhereTheBlowAt",
                    "rounded_score": 40908,
                    "tokens": [{
                        "token": "wheretheblowat"
                    }],
                    "inline": false
                }, {
                    "topic": "where are we gonna meet up",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "are"
                    }, {
                        "token": "we"
                    }, {
                        "token": "gonna"
                    }, {
                        "token": "meet"
                    }, {
                        "token": "up"
                    }],
                    "inline": false
                }, {
                    "topic": "where are you at summer",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "are"
                    }, {
                        "token": "you"
                    }, {
                        "token": "at"
                    }, {
                        "token": "summer"
                    }],
                    "inline": false
                }, {
                    "topic": "wheresanna",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "wheresanna"
                    }],
                    "inline": false
                }, {
                    "topic": "where you at donna",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "you"
                    }, {
                        "token": "at"
                    }, {
                        "token": "donna"
                    }],
                    "inline": false
                }, {
                    "topic": "where is justin bieber",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "is"
                    }, {
                        "token": "justin"
                    }, {
                        "token": "bieber"
                    }],
                    "inline": false
                }, {
                    "topic": "where the air is sweet",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "the"
                    }, {
                        "token": "air"
                    }, {
                        "token": "is"
                    }, {
                        "token": "sweet"
                    }],
                    "inline": false
                }, {
                    "topic": "where is luke",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "is"
                    }, {
                        "token": "luke"
                    }],
                    "inline": false
                }, {
                    "topic": "where is harry styles",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "is"
                    }, {
                        "token": "harry"
                    }, {
                        "token": "styles"
                    }],
                    "inline": false
                }, {
                    "topic": "where to buy beats",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "to"
                    }, {
                        "token": "buy"
                    }, {
                        "token": "beats"
                    }],
                    "inline": false
                }, {
                    "topic": "where are they",
                    "rounded_score": 35857,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "are"
                    }, {
                        "token": "they"
                    }],
                    "inline": false
                }, {
                    "topic": "where jc",
                    "rounded_score": 32980,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "jc"
                    }],
                    "inline": false
                }, {
                    "topic": "where's dylan o'brien",
                    "rounded_score": 32980,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "s"
                    }, {
                        "token": "dylan"
                    }, {
                        "token": "o"
                    }, {
                        "token": "brien"
                    }],
                    "inline": false
                }, {
                    "topic": "where is drenthe",
                    "rounded_score": 32980,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "is"
                    }, {
                        "token": "drenthe"
                    }],
                    "inline": false
                }, {
                    "topic": "where is anita",
                    "rounded_score": 32980,
                    "tokens": [{
                        "token": "where"
                    }, {
                        "token": "is"
                    }, {
                        "token": "anita"
                    }],
                    "inline": false
                }, {
                    "topic": "wheres my quarter",
                    "rounded_score": 32980,
                    "tokens": [{
                        "token": "wheres"
                    }, {
                        "token": "my"
                    }, {
                        "token": "quarter"
                    }],
                    "inline": false
                }],
                "oneclick": [],
                "hashtags": [],
                "completed_in": 0.005,
                "query": "where"
            },
            "baidu": {
                "q": "where",
                "p": false,
                "s": ["whereas", "where are you now", "where is the love", "where are you", "whereby", "where did you go", "wherever you are", "where did you sleep last night", "wherever", "where there is a will there is a way"]
            },
            "yandex": ["where", ["where's my refund", "where is chuck norris", "where the wild things are", "where", "where's my refund 2013", "where is my tax refund", "wheresmyrefund irs refund status", "where's my state refund", "where is my state refund", "where's my water", ["", "where is my mind", {
                    "sg_weight": 3.69087e-9,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }],
                ["", "where the wild roses grow", {
                    "sg_weight": 1.58832e-9,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }],
                ["", "wherever you go", {
                    "sg_weight": 1.35346e-9,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }],
                ["", "where have you been", {
                    "sg_weight": 1.30423e-9,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }],
                ["", "where them girls at", {
                    "sg_weight": 1.10014e-9,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }],
                ["", "where are you", {
                    "sg_weight": 9.90519e-10,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }],
                ["", "where did you sleep last night", {
                    "sg_weight": 8.15709e-10,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }],
                ["", "where is the love", {
                    "sg_weight": 7.31462e-10,
                    "search_cgi": [
                        ["noreask", "1"]
                    ]
                }]
            ], {
                "r": 211,
                "log": "sgtype:BBBBBBBBBBArtArtArtArtArtArtArtArt",
                "continue": "'s"
            }]
        }
    };
}();
