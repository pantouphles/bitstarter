#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require("restler");
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "https://www.coursera.org/";
var URL_FILENAME = "url_file.txt";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {

    // $ is a parse tree of an html file
    $ = cheerioHtmlFile(htmlfile);

    // checks is an array of tags
    var checks = loadChecks(checksfile).sort();

    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var checkArgs = function(program){
    if (program.file && program.url) {
	console.error("Warning: have specified both file and url");
    }
};

var getUrl = function(url) {
    rest.get(url).on('complete', function(result, response){
	if (result instanceof Error) {
	    console.log("Error: " + response.message);
	    //this.retry(5000);
	} else {
	    fs.writeFileSync(URL_FILENAME, result);
	}
    });
};

var getHtmlFile = function(filename, url) {
    if (filename) {
	return filename;
    } else if (url) {
	getUrl(url);
	return URL_FILENAME;
    } else {
	//shouldn't get here - throw an error!
    }
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
	.option('-u, --url <url>', 'URL to page')
        .parse(process.argv);

    checkArgs(program);

    var htmlFile = getHtmlFile(program.file, program.url);
    var checkJson = checkHtmlFile(htmlFile, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
