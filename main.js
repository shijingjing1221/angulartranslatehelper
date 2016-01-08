var cheerio = require('cheerio'),
    fs = require('fs'),
    html2jade = require('html2jade');

var productPath = "/project/dnshelper";
var stateNames = ["cacheonly", "download", "firewall", "main", "serverinfo", "type", "version", "view", "zone"];

for (var i = 0; i < stateNames.length; ++i) {
    var stateName = stateNames[i];
    var fileSource = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.html';
    var fileTargetHtml = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.html.tmp';
    var fileTargetJade = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.jade.tmp';
    var fileJson = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.json';;
    var prefix = stateName.toUpperCase();
    parseOneFile(fileSource, fileTargetHtml, fileTargetJade, fileJson, prefix);
}

function parsrText(self) {
    var textTrim = self.text().trim();
    if (textTrim == '' || textTrim.search(/\{\{.*\}\}/) >= 0) {
        return 0;
    }
    if (self.children().length == 0) {
        return 1;
    }
    if (self.children('input').length == self.children().length) {
        return 2;
    }
    return 0;
}

function parseOneFile(fileSource, fileTargetHtml, fileTargetJade, fileJson, prefix) {
    fs.readFile(fileSource, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        //Load the HTML, and parse the DOM with cheerio
        $ = cheerio.load(data, {
            normalizeWhitespace: false,
            xmlMode: true,
            decodeEntities: false
        });
        //Search each node in the dom
        var locationString = "";
        $('*').each(function (i, item) {
            var parserResult = parsrText($(this));
            //If dom is the leaf node
            if (parserResult != 0) {
                var textTrim = $(this).text().trim();
                locationString = locationString + "'" + prefix + "_TEXT" + i + "': '" + textTrim + "',\n";
                if (parserResult == 1) {
                    $(this).attr('ng-bind-html', function () {
                        $(this).text('');
                        return "{{'" + prefix + "_TEXT" + i + "'|translate}}"

                    });
                }
                if (parserResult == 2) {
                    $(this).append("{{'" + prefix + "_TEXT" + i + "'|translate}}");
                }

            }
        });
        var html = $.html();
        //Write Html with translate attr ng-bind-html
        fs.writeFile(fileTargetHtml, html, function (err) {
            if (err) return console.log(err);
        });
        //Write Jade with translate attr ng-bind-html
        html2jade.convertHtml(html, {
            bodyless: true,
            nspaces: 4,
            donotencode: true
        }, function (err, jade) {
            console.log(jade);
            fs.writeFile(fileTargetJade, jade, function (err) {
                if (err) return console.log(err);
            });
        });
        //Write the Json file
        fs.writeFile(fileJson, locationString, function (err) {
            console.log(locationString);
            if (err) return console.log(err);
        });

    });
}