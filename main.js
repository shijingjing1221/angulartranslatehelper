var cheerio = require('cheerio'),
  fs = require('fs'),
  html2jade = require('html2jade'),
  pkg = require('./package');

var productPath = pkg.productPath;

// var stateNames = ["cacheonly", "download", "firewall", "main", "serverinfo", "type", "version", "view", "zone"];
var stateNames = [];
fs.readdir(productPath + '/.tmp/app/', function (err, items) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    console.log(item);
    if (item.search(/\./) < 0) {
      stateNames.push(item);
    }

  }
  console.log(stateNames);
  parserFiles();
});


function parserFiles() {
  for (var i = 0; i < stateNames.length; ++i) {
    var stateName = stateNames[i];
    var fileSource = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.html';
    var fileTargetHtml = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.html.tmp';
    var fileTargetJade = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.jade.tmp';
    var fileJson = productPath + '/.tmp/app/' + stateName + '/' + stateName + '.json.tmp';;
    var prefix = stateName.toUpperCase();
    parseOneFile(fileSource, fileTargetHtml, fileTargetJade, fileJson, prefix);
  }
}

function parserText(self, item) {
  var tagName = item.tagName;
  var textTrim = self.text().trim();
  if (tagName == 'pre' || tagName == 'code' || textTrim == '' || textTrim.search(/\{\{.*\}\}/) >= 0) {
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
    var count = 0;
    var translateKeyword = "";
    $('*').each(function (i, item) {
      var parserResult = parserText($(this), item);
      //If dom is the leaf node
      if (parserResult != 0) {
        ++count;
        translateKeyword = prefix + "_TEXT" + count + "_" + item.tagName.toUpperCase();
        var textTrim = $(this).text().trim();
        locationString = locationString + "'" + translateKeyword + "': '" + textTrim + "',\n";
        if (parserResult == 1) {
          $(this).attr('bind-html-unsafe', function () {
            $(this).text('');
            return "'" + translateKeyword + "'|translate"

          });
        }
        if (parserResult == 2) {
          $(this).append("{{'" + translateKeyword + "'|translate}}");
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