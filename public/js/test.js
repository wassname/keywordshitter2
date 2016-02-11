var expect = chai.expect;
var assert = chai.assert;

describe('db', function() {
    it('should correctly set up db', function() {
        var dbReq=setUpDb();
        var oldonsuccess=dbReq.onsuccess;
        dbReq.onsuccess=function(event){
            // override onld onsucess because it doesn't use promises
            var db=oldonsuccess.bind(dbReq)(event);
            assert(db);
        };
    });
});


describe('extractDomain', function(){

    it('should correctly extract domain from url', function() {
        for (var expectedDomain in testData.domainUrls) {
            if (testData.domainUrls.hasOwnProperty(expectedDomain)) {
                var url = testData.domainUrls[expectedDomain];
                var domain = extractDomain(url);
                assert.equal(expectedDomain,domain);
            }
        }
    });
});

// describe('permute', function(){
//     it('should correctly permute results and add to queue', function() {
//     });
// });

// TODO use localForage or most popular promise wrapper for indexedDB then test
// describe('exportDB', function(){
//     before(function() {
//         // setup up test db
//     });
//
//     after(function() {
//         // tear down test db
//     });
//
//     it('should correctly download json file', function() {
//         exportDB();
//     });
// });

describe('responses', function(){
    it('should correctly parse test data', function() {
        for (var service in testData.responses) {
            if (testData.responses.hasOwnProperty(service)) {
                var res = testData.responses[service];
                var options = {service:service};
                var parsedRes = parseServiceResponse(res,options);

                assert.typeOf(parsedRes,'array');
                expect(parsedRes).to.have.length.above(1);
                parsedRes.map(r => assert.typeOf(r, 'string'));
            }
        }
    });
});

describe('services', function() {
    'use strict';

    // data
    var services = ["google", "google news", "google shopping", "google books", "youtube", "google videos", "google images", "yahoo", "bing", "ebay", "amazon", "twitter", "baidu", "yandex"];
    var searches = ["where"];
    var searches2 = [""," "," * ",":)","❥","غرف شات","汉字"];

    before(function() {

    });

    after(function() {

    });

    it('should correctly get and parse data', function() {
        services.forEach(function(service){
            searches.forEach(function(search){
                var options = {service:service};
                var url = getUrl(options)+search;
                $.ajax({
                    url: url,
                    async: false,
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    success: function (res, statusText, jqXHR) {
                        assert(statusText=="success");
                        assert(res!==[]);


                        var parsedRes = parseServiceResponse(res,options);
                        assert.typeOf(parsedRes,'array');
                        expect(parsedRes).to.have.length.above(1);
                        parsedRes.map(r => assert.typeOf(r, 'string'));

                    },
                    error: function(jqXHR,textStatus,err){
                        throw(err);
                    }
                });
            });
        });
    });

});
