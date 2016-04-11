var expect = chai.expect;
var assert = chai.assert;

// TODO
describe('permute', function(){
    before(function() {
        KWS.hashMapInputs = {};
        KWS.keywordsToQuery = [];
    });

    after(function() {
        KWS.hashMapInputs = {};
        KWS.keywordsToQuery = [];
    });

    it('should correctly permute results and add to queue', function() {
        var retList = ['a','b','c d',' a longer one'];
        KWS.permuteResultsToQueue(retList,'test');
        expect(KWS.keywordsToQuery).to.have.length.above(0)
        // assert(KWS.hashMapInputs['b']);
        expect(KWS.hashMapInputs).to.include.key('test');
        // var options = KWS.getOptions();
        // var expectedLength = options.prefixes.length*retList.length+options.suffixes.length*retList.length
        // assert(KWS.keywordsToQuery.length==expectedLength,''+expectedLength+'!='+KWS.keywordsToQuery.length);
    });
});


describe('extractDomain', function(){

    for (var expectedDomain in testData.domainUrls) {
        if (testData.domainUrls.hasOwnProperty(expectedDomain)) {
            it('should correctly extract domain from url, domain='+expectedDomain, function() {
                var url = testData.domainUrls[expectedDomain];
                var domain = KWS.extractDomain(url);
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
                var parsedRes = KWS.parseServiceResponse(res,service);

                expect(parsedRes).to.be.an('array')
                    .that.has.length.above(1);
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
    // var services = ["google", "google news", "google shopping", "google books", "youtube", "google videos", "google images", "yahoo", "bing", "ebay", "amazon", "twitter", "baidu", "yandex"];
    var services = Object.keys(KWS.services);
    var searches = ["where"];
    var searchesDifficult = [" * ", "❥"];


    before(function() {

    });

    after(function() {

    });

    services.forEach(function(service){
        searches.forEach(function(search){
            it('should correctly get and parse data'+'. Service="'+service+'" search="'+search+'"', function(done) {
                var url = KWS.getUrl(service)+search;
                return $.ajax({
                    url: url,
                    async: false,
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    success: function (res, statusText, jqXHR) {
                            assert(statusText=="success");
                            assert(res!==[]);
                            var parsedRes = KWS.parseServiceResponse(res,service);
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
                var url = KWS.getUrl(service)+search;
                return $.ajax({
                    url: url,
                    async: false,
                    jsonp: "jsonp",
                    dataType: "jsonp",
                    success: function (res, statusText, jqXHR) {
                        assert(statusText=="success");
                        assert(res!==[]);

                        var parsedRes = KWS.parseServiceResponse(res,service);
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
