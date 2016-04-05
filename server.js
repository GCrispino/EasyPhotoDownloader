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

		request.on('error', function(e) {
		    console.log("Got error: " + e.message);
		});
	});
}

function readURLtoFile(url,writableStream,callback){
	//reads an URL and writes the received data into the 'writableStream' variable
	var protocol = url.split("://")[0];

	var request = require(protocol).get(url,function(res){
		console.log("Writing to file on path: " + writableStream.path);
		res.on('data',function(chunk){
			// console.log("writing stuff...");
			writableStream.write(chunk);
		});

		res.on('end',function(){
			writableStream.end();
			console.log("Finished writing to file on path: " + writableStream.path);
			callback();
		});

		request.on('error', function(e) {
			callback(e.message);
		});
	});
}

function downloadPhoto(albumName,photo,accessToken) {
	/*download photo to file system using a photo object retrieved
	 *from an API call*/

	var photoName;
	var photoURL = photo.images[0].source;
	var outputFile;

	if (photo.name == undefined || photo.name.length > 20)
		photoName = albumName + Math.ceil(Math.random() * 200);
	else
		photoName = photo.name;

	try {
		//checks if directory exists
		fs.accessSync(__dirname + '/photos/' + albumName);
	} catch (e) {
		//if it doesn't exist, it gets created
		fs.mkdirSync(__dirname + '/photos/' + albumName);
	}

	outputFile = fs.createWriteStream(__dirname + '/photos/' + albumName
		+ '/' + photoName + '.jpg');

	outputFile.on("error",function(){
		//I HAVE TO FIGURE OUT WHY THOSE ERRORS HAPPEN
		photoName = albumName + Math.ceil(Math.random() * 200);
		outputFile = fs.createWriteStream(__dirname + '/photos/' + albumName
			+ '/' + photoName + '.jpg');
	});

	//loads data into file
	readURLtoFile(photoURL,outputFile,function(errMessage){
		if (errMessage)
			console.log("Error message: " + errMessage);
	});
}

function downloadAlbum(album,accessToken){
	/*downloads all pictures from an album and
	* saves them in a specific folder */
	var albumId = album.id;
	var albumName = album.name;
	var url = "https://graph.facebook.com/v2.5/" + albumId
		+ "/photos?fields=name,images&access_token=" + accessToken;

	readURL(url,function(data){
		//gets information for all photos
		var photos = JSON.parse(data).data;

		for (photo of photos)
			downloadPhoto(albumName,photo,accessToken);
	});
}
function downloadAlbums(albums,accessToken){
	//function that downloads all pictures from all albums
	for (var album of albums)
		downloadAlbum(album,accessToken);
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
		downloadAlbums(albums,accessToken);
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
