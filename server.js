var http = require('http');
var express = require('express');
var fs = require("fs");
var archiver = require("archiver");
var app = express();
var archive = archiver("zip");
var port = 8080;


function readURL(url,callback){
	var data = "";
	var protocol = url.split("://")[0];

	var request = require(protocol).get(url,function(res){
		res.on('data',function(chunk){
			data += chunk;
		});

		res.on('end',function(){
			callback(data);
		});
	});
}

app.get('/',function(req,res){
	res.redirect('/index.html');
});

app.get('/getPhotos',function(req,res){
	var accessToken = req.query.access_token;
	var url = "https://graph.facebook.com/v2.5/me/albums?fields=name,id&access_token=" + accessToken;

	readURL(url,function(data){
		console.log(data);
		res.send(data);
	});
});

app.get('/download',function(req,res){
	var output = fs.createWriteStream(__dirname + '/public/zip/test.zip');

	archive.pipe(output);
	archive.bulk([{expand: true,cwd: './public/',src:['*.*']}]);
	archive.finalize();

	//sets event listener to send file when the writing is over
	output.on("close",function(){
		res.download(__dirname + '/public/zip/test.zip',function(err){
			if (err){
				console.log("No such file or directory!");
				res.send("0");
			}
		});
	});

})

app.use(express.static('public'));

console.log("Listening to port " + port);
app.listen(port);
