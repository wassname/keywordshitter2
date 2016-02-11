var expect = chai.expect;
var assert = chai.assert;

// TODO describe('permute', function(){
//     it('should correctly permute results and add to queue', function() {
//     });
// });

// TODO use localForage or most popular promise wrapper for indexedDB then test
// describe('exportDB', function(){
// });

describe('db', function() {
    it('should correctly set up db', function(done) {
        var dbReq=setUpDb();
        var oldonsuccess=dbReq.onsuccess;
        dbReq.onsuccess=function(event){
            // override onld onsucess because it doesn't use promises
            var db=oldonsuccess.bind(dbReq)(event);
            assert(db);
            assert(db.objectStoreNames.contains('suggestions'),'db should contain suggestons store');
            var indexNames =db.transaction('suggestions','readonly').objectStore('suggestions').indexNames;
            assert(indexNames.contains('keyword','search'));
            done();
        };
    });
});


describe('extractDomain', function(){

    for (var expectedDomain in testData.domainUrls) {
        if (testData.domainUrls.hasOwnProperty(expectedDomain)) {
            it('should correctly extract domain from url, domain='+expectedDomain, function() {
                var url = testData.domainUrls[expectedDomain];
                var domain = extractDomain(url);
                assert.equal(expectedDomain,domain);
            });
        }
    }

});


describe('responses', function(){
    for (var service in testData.responses) {
        if (testData.responses.hasOwnProperty(service)) {
            it('should correctly parse test data for service='+service, function() {
                var res = testData.responses[service];
                var options = {service:service};
                var parsedRes = parseServiceResponse(res,options);

                assert.typeOf(parsedRes,'array');
                expect(parsedRes).to.have.length.above(1);
                parsedRes.map(r => assert.typeOf(r, 'string'));
            });
        }
    }
});

describe('services', function() {
    'use strict';
    // TODO test for each language and country and assert results!=default res
    this.timeout(10000);
    this.slow(2000);

    // data
    var services = ["google", "google news", "google shopping", "google books", "youtube", "google videos", "google images", "yahoo", "bing", "ebay", "amazon", "twitter", "baidu", "yandex"];
    var searches = ["where"];
    var searchesDifficult = [" * ", "❥"];


    before(function() {

    });

    after(function() {

    });

    services.forEach(function(service){
        searches.forEach(function(search){
            it('should correctly get and parse data'+'. Service="'+service+'" search="'+search+'"', function(done) {
                var options = {service:service};
                var url = getUrl(options)+search;
                return $.ajax({
                    url: url,
                    async: false,
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    success: function (res, statusText, jqXHR) {
                            assert(statusText=="success");
                            assert(res!==[]);
                            var parsedRes = parseServiceResponse(res,options);
                            assert.typeOf(parsedRes,'array');
                            parsedRes.map(r => assert.typeOf(r, 'string'));
                            done();
                    },
                    error: function(jqXHR,textStatus,err){
                        done(err);
                        return err;
                    }
                });
            });
        });
    });


    services.forEach(function(service){
        searchesDifficult.forEach(function(search){
            it('should get and parse difficult data'+'. Service="'+service+'" search="'+search+'"', function(done) {
                var options = {service:service};
                var url = getUrl(options)+search;
                return $.ajax({
                    url: url,
                    async: false,
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    success: function (res, statusText, jqXHR) {
                        assert(statusText=="success");
                        assert(res!==[]);

                        var parsedRes = parseServiceResponse(res,options);
                        assert.typeOf(parsedRes,'array');
                        parsedRes.map(r => assert.typeOf(r, 'string'));
                        return done();

                    },
                    error: function(jqXHR,textStatus,err){
                        return done(err);
                    }
                });
            });
        });
    });

});
