acre.require('/test/lib').enable(this);

var u = acre.require.call(this, "__utils__");

// --------------------- sync urlfetch ---------------------------------

test('acre.urlfetch works',function() {
    var results = {};
    results.google    = acre.urlfetch("http://www.google.com/");
    results.youtube   = acre.urlfetch("http://www.youtube.com/");
    u.has_content(results.google,"Google");
    u.has_content(results.youtube,"YouTube");
});

test('acre.urlfetch can re-enter once',function() {
    var response = acre.urlfetch(acre.request.base_url + "sync_urlfetch");
    var results = JSON.parse(response.body);
    ok("google" in results && "youtube" in results)
});

test('acre.urlfetch fails with recursive re-entry',function() {
    try {
        acre.urlfetch(acre.request.base_url + "recursive_sync_urlfetch");
        ok(false,"exception wasn't triggered");
    } catch (e) {
        ok(true,"exception was triggered");
    }
});

test('acre.urlfetch redirection', function() {
    var url = "http://google.com/";
    var result1 = acre.urlfetch(url);
    equal(result1.status,200);
    var result2 = acre.urlfetch(url,{
        no_redirect : true
    });
    equal(result2.status,301);
});

test('acre.urlfetch no url',function() {
    var results = {};
    try {
      acre.urlfetch("");
      ok(true == false, 'urlfetch should not have suceeded');
    } catch (e) {
      equals(e.message, "'url' argument (1st) to acre.urlfetch() must be a string");
    }
});

test('acre.urlfetch invalid protocol',function() {
    var results = {};
    try {
      acre.urlfetch("telnet://www.googleapis.com/freebase/v1/text/en/google");
      ok(true == false, 'urlfetch should not have suceeded');
    } catch (e) {
      equals(e.message, "Malformed URL: telnet://www.googleapis.com/freebase/v1/text/en/google");
    }
});

test('acre.urlfetch invalid method',function() {
    var results = {};
    try {
      acre.urlfetch("www.google.com",
       options={"method":"foo"});
      ok(true == false, 'urlfetch should not have suceeded');
    } catch (e) {
      var pat = RegExp('Request to www.google.com appears to be a state-changing.+');
      ok(pat.test(e), 'acre should complain that this is unsafe');
    }
});

test('acre.urlfetch file no exist',function() {
    var results = {};
    try {
      acre.urlfetch(acre.request.base_url + 'noexist');
      ok(true == false, 'urlfetch should not have suceeded');
    } catch (e) {
      equals(e.message, "urlfetch failed: 404");
    }
});

test('acre.urlfetch binary data',function() {
    var response = acre.urlfetch("https://www.googleapis.com/freebase/v1/image/m/04pxcqr");
    equals(response.headers['content-length'], 2001);
    equals(response.headers['content-type'], 'image/jpeg');
});

// --------------------- async urlfetch ---------------------------------

test('parallel acre.async.urlfetch works',function() {
    var results = {};
    acre.async.urlfetch("http://www.google.com/", {
        'callback' : function (res) {
            results.google = res;
        }
    });
    acre.async.urlfetch("http://www.youtube.com/", {
        'callback' : function (res) {
            results.youtube = res;
        }
    });
    acre.async.wait_on_results();
    u.has_content(results.google,"Google");
    u.has_content(results.youtube,"YouTube");
});

test('chained acre.async.urlfetch works',function() {
    var results = {};
    acre.async.urlfetch("http://www.google.com/", {
        'callback' : function (res) {
            results.google = res;
            acre.async.urlfetch("http://www.youtube.com/", {
                'callback' : function (res) {
                    results.youtube = res;
                }
            });
        }
    });
    acre.async.wait_on_results();
    u.has_content(results.google,"Google");
    u.has_content(results.youtube,"YouTube");
});

test('acre.async.urlfetch can re-enter once',function() {
    var response = null;
    acre.async.urlfetch(acre.request.base_url + "async_urlfetch", {
        'callback' : function (res) {
            response = res;
        }
    });
    acre.async.wait_on_results();
    var results = JSON.parse(response.body);
    ok("google" in results && "youtube" in results)
});

test('acre.async.urlfetch fails with recursive re-entry',function() {
    var response = null;
    try {
        acre.async.urlfetch(acre.request.base_url + "recursive_async_urlfetch", {
            'callback' : function (res) {
                response = res;
            }
        });
        acre.async.wait_on_results();
        ok(false,"exception wasn't triggered");
    } catch (e) {
        ok(true,"exception was triggered");
    }
});

// ------------------------- sub-request security -----------------------------

var subreq_url = acre.request.base_url + "subrequest_urlfetch";

test('acre.urlfetch safe subrequest',function() {
    var response = acre.urlfetch(subreq_url);
    equal(response.body, "success");
});

test('unsafe subrequest using GET',function() {
    var url = acre.form.build_url(subreq_url, {
        "unsafe": true
    });
    var response = acre.urlfetch(url);
    equal(response.body, "subrequest error");
});

test('unsafe subrequest using GET and bless',function() {
    var url = acre.form.build_url(subreq_url, {
        "unsafe": true,
        "bless": true
    });
    var response = acre.urlfetch(url);
    equal(response.body, "success");
});

test('unsafe subrequest using just POST', {"bug": "can't run since test driver doesn't support making safe requests"}, function() {
    var url = acre.form.build_url(subreq_url, {
        "unsafe": true
    });
    var response = acre.urlfetch(url, {
        "method": "POST"
    });
    equal(response.body, "subrequest error");
});

test('unsafe subrequest using POST & X-Requested-With header', {"bug": "can't run since test driver doesn't support making safe requests"}, function() {
    var url = acre.form.build_url(subreq_url, {
        "unsafe": true
    });
    var response = acre.urlfetch(url, {
        "method": "POST",
        "headers": {
            "X-Requested-With": 1
        }
    });
    equal(response.body, "success");
});



// --------------------------- mixed ----------------------------------------

test('sync and async urlfetch obtain the same cookies',{"bug": "with ae 1.4.2 getting diff google cookies in buildbot, no clue"}, function() {
    // bug: just can't figure it out, introduced with ae 1.4.2 but i only see it in the buildbot env
    var sync_response = acre.urlfetch(acre.request.base_url + "sync_urlfetch");
    var sync_results = JSON.parse(sync_response.body);

    var async_response = acre.urlfetch(acre.request.base_url + "async_urlfetch");
    var async_results = JSON.parse(async_response.body);

    // check google cookies ---------------------

    var sync_google_cookies = u.cookie_names(sync_results.google);
    var async_google_cookies = u.cookie_names(async_results.google);

    equal(sync_google_cookies,async_google_cookies);

    // check google cookies ---------------------

    var sync_youtube_cookies = u.cookie_names(sync_results.youtube);
    var async_youtube_cookies = u.cookie_names(async_results.youtube);

    equal(sync_youtube_cookies,async_youtube_cookies);
});

acre.test.report();
