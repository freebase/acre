/*
 * Return the script under test as a full URL
 */
function script_under_test() {
    return acre.request.base_url + acre.request.script.name.replace("test_","");
}

/*
 * make sure that a URL got fetched correctly by looking into the domain of a tracking cookie they set
 * which is probably the least likely part of their web page that is likely to change over time.
 * Note that the test is designed to pass if the URL fetching returns with a status code that is not 200. 
 * This is not bad because we're testing acre's urlfetching machinery, not the availability of these websites
 */
function has_correct_domain(res,cookie_name,domain) {
    ok(((res.status == 200 && res.cookies[cookie_name].domain.indexOf(domain) > -1) || res.status != 200),  domain);
}

/*
 * make sure that a URL got fetched correctly by looking into the body of the response for the given content fragment
 * Note that the test is designed to pass if the URL fetching returns with a status code that is not 200. 
 * This is not bad because we're testing acre's urlfetching machinery, not the availability of these websites
 */
function has_content(res,fragment) {
    ok(((res.status == 200 && res.body.indexOf(fragment) > -1) || res.status != 200),  fragment);
}

/*
 * returns a sorted and comma separated list of cookie names given an response object
 */
function cookie_names(response) {
    var names = [];
    for (var c in response.cookies) {
        names.push(c);
    }
    names.sort();
    return names.join(",");
}

/*
 * parse metaweb costs
 */
function metaweb_costs(response) {
    var costs = {};
    var cost_str = response.headers['x-metaweb-cost'];
    if (typeof cost_str != 'undefined') {
        var costs_frags = cost_str.split(',');
        for (var i = 0; i < costs_frags.length; i++) {
            var frag = costs_frags[i];
            var pieces = frag.split('=');
            costs[trim(pieces[0])] = trim(pieces[1]);
        }
    }
    return costs;
}

/*
 * Remove leading and trailing whitespace from the given string
 */
function trim(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

/*
 * Return false if the browser sent a request with a 'cache-control: no-cache' header (normally triggered by hitting shift-reload)
 */
function is_caching() {
    return !(acre.request.headers['cache-control'] == 'no-cache');
}