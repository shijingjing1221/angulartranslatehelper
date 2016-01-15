var fs = require('fs'),
  pkg = require('./package'),
  XRegExp = require('xregexp'),
  _ = require('lodash');

getTextReviewArray(matchTextsInJson);

function getTextReviewArray(callback) {
  var textReview = XRegExp('Original:(?<old>.*)\nProposed:(?<new>.*)\n', "im");
  var textReviewArray = [];
  // var textReviewObjs = {};
  fs.readFile('/home/jshi/tmp/Backupproposetext.txt', 'utf8', function (err, data) {
    XRegExp.forEach(data, textReview, function (match, i) {
      var obj = {
        old: match.old.trim(),
        new: match.new.trim()
      };
      textReviewArray.push(obj);
      // textReviewObjs[match.new.trim()] = match.old.trim();
    });
    if (callback != undefined && callback != null) {
      callback(textReviewArray);
    }

  });
  return textReviewArray;
}

function matchTextsInJson(textReviewArray) {
  fs.readFile('/home/jshi/tmp/messages_en.json', 'utf8', function (err, data) {
    var json = JSON.parse(data);
    var resultJson = {};
    _.forEach(json, function (value, key) {
      var matchedText = getMatchedText(value, textReviewArray);
      if (matchedText != false) {
        resultJson[key] = matchedText;
      }else{
        resultJson[key] = value;
      }

    });
    var output = JSON.stringify(resultJson, null, 2);
    // console.log(output);
    fs.writeFile('/home/jshi/tmp/messages_en.tmp.json', output, function (err) {
      if (err) return console.log(err);
    });
  });

}

function getMatchedText(value, textReviewArray) {
  var matchedText = false;
  _.each(textReviewArray, function (item) {
    if (item.old == value) {
      matchedText = item.new;
      return;
    }
  });
  return matchedText;
}
