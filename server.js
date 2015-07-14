var http = require('http');
var fs = require('fs')
var querystring = require('querystring');
var PORT = 9090;
var HOST = '0.0.0.0';
var PUBLIC_DIR = './public/';
var ELEMENTS_DIR = './elements/';
var Method = {
  GET : 'GET',
  POST : 'POST',
  HEAD : 'HEAD'
};

var server = http.createServer(handleRequest);


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
          fs.writeFile(PUBLIC_DIR + ELEMENTS_DIR + pathname, htmlGenerator(postData.elementName, postData.elementSymbol, postData.elementAtomicNumber, postData.elementDescription), function(err) {
            // -respond 200, {"success": true}
            response.write("{\"success\" : true}");
            //end the response
            response.end();
          });

          // auto update index
          // fs.stat(PUBLIC_DIR + 'index.html', function(err, stats) {
          //   fs.open(PUBLIC_DIR + 'index.html', 'a+', function(error, fd) {
          //     var buffer = new Buffer(stats.size);
          //     var data = buffer.toString('utf8');
          //     console.log(buffer)

          //     fs.write(fd, 'hello', 34, buffer.length, function(err, bytesRead, buffer) {
          //       var data = buffer.toString('utf8');
          //       fs.close(fd)
          //     });
          //   });
          // });

          fs.readdir(PUBLIC_DIR + ELEMENTS_DIR, function(err, files) {
            counter = files.length;
          });

          fs.readFile(PUBLIC_DIR + 'index.html', function(err, data) {
            var indexHTML = data.toString('utf-8');
            var splitLine = '<!-- links here -->';
            var splitLineLength = splitLine.length;
            var split = indexHTML.indexOf(splitLine);
            var top = indexHTML.substring(0, split);
            var li = '<li><a href="/' + pathname + '">' +  postData.elementName + '</a></li>\n';
            var h3StartSubstring = indexHTML.substring(230, 244);
            var h3EndSubstring = indexHTML.substring(245, 250);
            var h3String = h3StartSubstring + counter + h3EndSubstring;
            console.log(h3String)
            var bottom = indexHTML.substring(split + splitLineLength, indexHTML.length);
            fs.writeFile(PUBLIC_DIR + 'index.html', top + li + splitLine + bottom, function() {

            });
          });


        }
      });

    });



    function htmlGenerator(elementName, elementSymbol, elementAtomicNumber, elementDescription) {
      return '<!DOCTYPE html>\n' +
              '<html lang="en">\n' +
              '<head>\n' +
                '\t<meta charset="UTF-8">\n' +
                '\t<title>The Elements - ' + elementName + '</title>\n' +
                '\t<link rel="stylesheet" href="/css/styles.css">\n' +
              '</head>\n' +
              '<body>\n' +
                '\t<h1>' + elementName + '</h1>\n' +
                '\t<h2>' + elementSymbol + '</h2>\n' +
                '\t<h3>Atomic number ' + elementAtomicNumber + '</h3>\n' +
                '\t<p>' + elementDescription + '</p>\n' +
                '\t<p><a href="/">back</a></p>\n' +
              '</body>\n' +
              '</html>\n'
    }
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
      case '/hydrogen.html':
        uri = 'hydrogen.html';
        break;
      case '/helium.html':
        uri = 'helium.html';
        break;
      case '/404.html':
        uri = '404.html';
        break;
      case 'styles.css':
        uri = 'css/styles.css';
        break;
    }

    fs.exists(PUBLIC_DIR + ELEMENTS_DIR + uri, function(exists) {
      if (exists) {
        fs.readFile(PUBLIC_DIR + ELEMENTS_DI + uri, function(err, data) {
          if (err) throw err;

          response.write(data);
          response.end();

        });
      } else {
        response.statusCode = 404;
        response.write('<h1>File does not exist</h1>!');
        response.end();
      }
    });
  }
}

server.listen(PORT, function() {
  console.log('http server listening on ' + PORT);
});