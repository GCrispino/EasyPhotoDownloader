var http = require('http');
var express = require('express');
var fs = require("fs");
var archiver = require("archiver");
var app = express();
var archive = archiver("zip");
var port = 8080;


function validateAlbumName(albumName) {
	/*if the album name ends with a dot('.') or a space(" "),
	*this character is removed.
	*This is done because directories' names cannot end with these
	*characters on the windows OS
	*/
	if (albumName.endsWith('.') || albumName.endsWith(' ')){
		//removes the last character
		/*regex that matches any number or combination of dots and white spaces
		 *at the end of the string
		*/
		return albumName.replace(/(\.*|\s*|(\.*\s*)*|(\s*\.*)*)$/,"");
	}
	else
		return albumName;
}

function iterate(array,func,args,callback){
	/*iterates through an array executing a asynchronous function to each
	 *element in a synchronous way, using a closure and recursion
	 *
	 *PARAMETERS:
	 *'array': array to be iterated through
	 *'func': function that will be executed on each iteration
	 *'args': arguments passed to function 'func', along with a
	 	callback function
	 * 'callback': callback function that is called at the end of the iteration
	*/

	(function iterator(i){
		if (i < array.length){
			func.apply(this,[array[i]].concat(args).concat(function(errMessage){
				if (errMessage)
					console.log("Error: " + errMessage);
				else
					iterator(i + 1);
			}));
		}
		else
			callback();
	})(0);

}

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

function downloadPhoto(photo,albumName,accessToken,callback) {
	/*download photo to file system using a photo object retrieved
	 *from an API call*/

	var photoName = photo.name;
	var photoURL = photo.images[0].source;
	var outputFile;

	//album's name is validated
	albumName = validateAlbumName(albumName);

	try {
		//checks if directory exists
		fs.accessSync(__dirname + '/photos/' + albumName);
	} catch (e) {
		//if it doesn't exist, it gets created
		fs.mkdirSync(__dirname + '/photos/' + albumName);
	}

	//write stream handling
	//-------------------------------------------------------------------------
	outputFile = fs.createWriteStream(__dirname + '/photos/' + albumName
		+ '/' + photoName + '.jpg');

	outputFile.on("error",function(){
		//I HAVE TO FIGURE OUT WHY THOSE ERRORS HAPPEN
		photoName = albumName + Math.ceil(Math.random() * 200);
		outputFile = fs.createWriteStream(__dirname + '/photos/' + albumName
			+ '/' + photoName + '.jpg');
	});
	//-------------------------------------------------------------------------

	//loads data into file
	readURLtoFile(photoURL,outputFile,function(errMessage){
		if (errMessage)
			console.log("Error: " + errMessage);
		else
			callback(errMessage);
	});
}

function downloadAlbum(album,accessToken,callback){
	/*downloads all pictures from an album and
	* saves them in a specific folder */
	var albumId = album.id;
	var albumName = album.name;
	var url = "https://graph.facebook.com/v2.5/" + albumId
		+ "/photos?fields=name,images&access_token=" + accessToken;

	var photos;

	console.log("Downloading album " + albumName);

	(function getAllPhotos(url){
		/*Closure that gets all album's photos' data
		 *before actually downloading it*/
		readURL(url,function(data){
			var newData = JSON.parse(data);

			if (photos)
				photos = photos.concat(newData.data);
			else
				photos = newData.data;

			if (newData.paging && newData.paging.next){
				url = newData.paging.next;
                getAllPhotos(url);
			}
			else {
				//updates photos' names as the album name plus an index
				for (var i = 0; i < photos.length; i++)
					photos[i].name = albumName + "_" + (i + 1);

				//when all photos' information is get, then the downloading process starts
				iterate(photos,downloadPhoto,[albumName,accessToken],callback);
			}

		})
	})(url);
}

function downloadAlbums(albums,accessToken,callback){
	//function that downloads all pictures from all albums
	iterate(albums,downloadAlbum,[accessToken],callback);
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
		if (JSON.parse(data).error) //if error on API call
			console.log(JSON.parse(data).error.message);
		else{
			var albums = JSON.parse(data).data;
			downloadAlbums(albums,accessToken,function(){
				//downloadPhotosToClient();
				//deleteData();
				console.log("after download albums");

				//downloadTimelinePhotos(accessToken,function(){});

				res.end();
			});
		}
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
