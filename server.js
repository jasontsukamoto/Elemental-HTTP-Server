var http = require('http');
var fs = require('fs')
var querystring = require('querystring');
var PORT = 9090;
var HOST = '0.0.0.0';
var PUBLIC_DIR = './public/';
var ELEMENTS_DIR = 'elements/';
var Method = {
  GET : 'GET',
  POST : 'POST',
  PUT : 'PUT'
};

var server = http.createServer(handleRequest);

function htmlGenerator(element) {
  return '<!DOCTYPE html>\n' +
          '<html lang="en">\n' +
          '<head>\n' +
            '\t<meta charset="UTF-8">\n' +
            '\t<title>The Elements - ' + element.elementName + '</title>\n' +
            '\t<link rel="stylesheet" href="/css/styles.css">\n' +
          '</head>\n' +
          '<body>\n' +
            '\t<h1>' + element.elementName + '</h1>\n' +
            '\t<h2>' + element.elementSymbol + '</h2>\n' +
            '\t<h3>Atomic number ' + element.elementAtomicNumber + '</h3>\n' +
            '\t<p>' + element.elementDescription + '</p>\n' +
            '\t<p><a href="/">back</a></p>\n' +
          '</body>\n' +
          '</html>\n'
}

function handleRequest(request, response) {
  var requestBody = '';
  /*
    If request.method is POST
      -parse form data
      -save file in designated public directory based on content
      -if file does not exist named after the elements name, append with html file extension
      -respond to POST with http response code 200 {'success' : true}
   */

  if (request.method === Method.POST) {
    //parse data
    request.on('data', function(chunk) {
      console.log('Received body data: ');
      requestBody += chunk.toString();
    });

    /*
      postData {
        elementName: ,
        elementSymbol: ,
        elementAtomicNumber: ,
        elementDescription:
      }
     */
    request.on('end', function() {
      var postData = querystring.parse(requestBody);
      var pathname = postData.elementName.toLowerCase() + '.html';
      var counter;

      //check if the pathname exists
      fs.exists(PUBLIC_DIR + ELEMENTS_DIR + pathname, function(exists) {
        if (exists) {
          // respond 200, {"succes" : false}
          response.write("{\"success\" : false}");
          //end the response
          response.end();
        } else {
          // -create new file in public
          fs.writeFile(PUBLIC_DIR + ELEMENTS_DIR + pathname, htmlGenerator(postData), function(err) {
            // -respond 200, {"success": true}
            response.write("{\"success\" : true}");
            //end the response
            response.end();

            fs.readdir(PUBLIC_DIR + ELEMENTS_DIR, function(err, files) {
              var elements = files.filter(function(value) {
                return value.indexOf('html') > -1
              });
              counter = elements.length;
            });

            fs.readFile(PUBLIC_DIR + 'index.html', function(err, data) {
              var indexHTML = data.toString('utf-8');
              var counterStart = '<!-- counter here -->';
              var counterStartLength = counterStart.length;
              var counterEnd = '<!-- end counter -->';
              var counterEndLength = counterEnd.length;
              var splitLine = '<!-- links here -->';
              var splitLineLength = splitLine.length;
              var counterBeginSplit = indexHTML.indexOf(counterStart);
              var top = indexHTML.substring(0, counterBeginSplit + counterStartLength);
              var counterEndSplit = indexHTML.indexOf(counterEnd);
              var split = indexHTML.indexOf(splitLine);
              var indexBody = indexHTML.substring(counterEndSplit, split);
              var li = '<li><a href="/elements/' + pathname + '">' +  postData.elementName + '</a></li>\n' + splitLine;
              var h3Substring = indexHTML.indexOf(counterStart) + counterStartLength;
              var counterUpdate = '<h3>These are ' + counter + '</h3>'
              var bottom = indexHTML.substring(split + splitLineLength, indexHTML.length);
              fs.writeFile(PUBLIC_DIR + 'index.html', top + counterUpdate + indexBody + li + bottom, function() {

              });
            });
          });
        }
      });
    });

  } else if (request.method === Method.GET) {
    /*
        If request.method is GET
          -serve contents in public directory if matching uri
          -if url doesn't exist reutn 404 response code and html contents of 404.html
        -end connection
     */
    var uri = request.url;

    switch (uri) {
      case '/':
        uri = 'index.html';
        break;
    }

    fs.exists(PUBLIC_DIR + uri, function(exists) {
      if (!exists) {
        response.statusCode = 404;
        response.write('<h1>File does not exist</h1>!');
        response.end();
      } else {
        fs.readFile(PUBLIC_DIR + uri, function(err, data) {
          if (err) throw err;

          response.write(data);
          response.end();

        });
      }
    });
  } else if (request.method === Method.PUT) {
    var requestBody = '';

    request.on('data', function(chunk) {
      requestBody += chunk;
    });

    request.on('end', function() {
      var postData = querystring.parse(requestBody);
      var pathname = postData.elementName + '.html';
      console.log(pathname);

      /*
        check if pathname exists
          -if it doesnt
            -throw error
          -else update page
       */

      fs.exists(PUBLIC_DIR + ELEMENTS_DIR + pathname, function(exists) {
        if (!exists) {
          response.write("{error : resource /" + pathname + " does not exist}");
          response.end();
        } else {
          fs.writeFile(PUBLIC_DIR + ELEMENTS_DIR + pathname, htmlGenerator(postData), function(err) {
            // -respond 200, {"success": true}
            response.write("{\"success\" : true}");
            //end the response
            response.end();
          });
        }
      });
    });
  }
}

server.listen(PORT, function() {
  console.log('http server listening on ' + PORT);
});