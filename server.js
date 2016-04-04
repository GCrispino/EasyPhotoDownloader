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

function downloadAlbum(album){
	/*downloads all pictures from an album and
	* saves them in a specific folder */

}
function downloadAlbums(albums){
	//function that downloads all pictures from all albums
	for (var album of albums){
		downloadAlbum(album);
	}
}

app.get('/',function(req,res){
	res.redirect('/index.html');
});

app.get('/getPhotos',function(req,res){
	//route made to get all the user's photos and disponibilize it to download
	var accessToken = req.query.access_token;
	var url = "https://graph.facebook.com/v2.5/me/albums?fields=name,id&access_token=" + accessToken;

	readURL(url,function(data){
		//array that stores data for all the user's albums
		var albums = JSON.parse(data).data;
		downloadAlbums(albums);
		res.end();
	});
});

app.get('/download',function(req,res){
	var output = fs.createWriteStream(__dirname + '/public/zip/photos.zip');

	archive.pipe(output);
	archive.bulk([{expand: true,cwd: './public/',src:['*.*']}]);
	archive.finalize();

	//sets event listener to send file when the writing is over
	output.on("close",function(){
		res.download(__dirname + '/public/zip/photos.zip',function(err){
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
