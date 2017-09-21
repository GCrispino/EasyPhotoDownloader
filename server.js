const express = require('express');
const fs = require('fs');
const Path = require('path');
const download = require('./download');

const app = express();
const port = process.env.PORT || 80;;



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
					console.log('Error: ' + errMessage);
				else
					iterator(i + 1);
			}));
		}
		else
			callback();
	})(0);

}

function getAllData(url){
	/*This function gets all data of an API object by using the 'next' cursor
	 * at the array 'array'
	 *
	 *PARAMETERS:
	 *	url: the url that represents a Graph API call
	 *	array: the array that will store all the data(for example: an 'albums'
	 *		array of an user's albums)
	 *	callback: the function that will be called once all the available
	 *		informations are obtained.
	*/
	let array; //array that will contain the API data

	return new Promise((resolve,reject) => {
		(function getData(url){
			/*Closure that gets all albums' data
			 *before actually downloading it
			 */
			download.readURL(url)
				.then(data => {
					let newData = JSON.parse(data);

					if (array)
						array = array.concat(newData.data);
					else
						array = newData.data;

					if (newData.paging && newData.paging.next){
					//if there is more data to get, the function is recursively called
						url = newData.paging.next;
	                getData(url);
					}
					else
					//if there is not more data to get, then it resolves
						resolve(array);
				});
		})(url);
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

	outputFile.on('error',function(){
		//I HAVE TO FIGURE OUT WHY THOSE ERRORS HAPPEN
		photoName = albumName + Math.ceil(Math.random() * 200);
		outputFile = fs.createWriteStream(__dirname + '/photos/' + albumName
			+ '/' + photoName + '.jpg');
	});
	//-------------------------------------------------------------------------

	//loads data into file
	return download.readURLtoFile(photoURL,outputFile);
}

function downloadAlbum(album,accessToken,callback){
	/*downloads all pictures from an album and
	* saves them in a specific folder */
	var albumId = album.id;
	var albumName = album.name;
	var url = 'https://graph.facebook.com/v2.5/' + albumId
		+ '/photos?fields=id,name,images&access_token=' + accessToken;

	console.log('Downloading album ' + albumName);

	getAllData(url,function(photos){
		//updates photos' names as the album name plus an index
		for (var i = 0; i < photos.length; i++)
			photos[i].name = albumName + '_' + (i + 1);

		//when all photos' information is get, then the downloading process starts
		iterate(photos,downloadPhoto,[albumName,accessToken],callback);
	});
}

function downloadAlbums(albums,accessToken,callback){
	//function that downloads all pictures from all albums
	iterate(albums,downloadAlbum,[accessToken],callback);
}

function downloadPhotosToClient(res,callback){
	var output;

	try {
		//checks if directory exists
		fs.accessSync(__dirname + '/zip');
	} catch (e) {
		//if it doesn't exist, it gets created
		fs.mkdirSync(__dirname + '/zip');
	}

	output = fs.createWriteStream(__dirname + '/zip/photos.zip');

	// archive.pipe(output);
	// archive.bulk([{expand: true,cwd: __dirname + '/photos/',src:['*/*.*']}]);
	// archive.finalize();

	//sets event listener to send file when the writing is over
	output.on('close',function(){
		res.download(__dirname + '/zip/photos.zip',function(err){
			if (err){
				console.log('No such file or directory!');
				res.send('0');
			}
			else{
				callback();
			}
		});
	});
}

function getAllPhotosFromAlbum(album,accessToken){

	return new Promise( (resolve,reject) => {
		let albumId = album.id,
			url = 'https://graph.facebook.com/v2.5/' + albumId
				+ '/photos?fields=name,images&access_token=' + accessToken;

		getAllData(url)
			.then( photos => {
				album.photos = photos;
				resolve(album);
			});
	});

}

function formatDateToFolderName(date){
	const day = date.getDate(),
		  month = date.getMonth() + 1,
		  year = date.getFullYear(),
		  hours = date.getHours(),
		  minutes = date.getMinutes(),
		  seconds = date.getSeconds();
	return `${year}-${month}-${day}--${hours}-${minutes}-${seconds}`
}

function getAllPhotosFromAlbums(albums,accessToken){
	return Promise.all(albums.map(album => getAllPhotosFromAlbum(album,accessToken)));
}

function createFolders(albums){
	const baseDirectory = __dirname + '/public/photos/' + formatDateToFolderName(new Date());

	return new Promise( (outerResolve,outerReject) => {
		
		fs.mkdir(baseDirectory, err => {
			if (err) return outerReject(err);

			const promises = albums.map(album => new Promise( (resolve,reject) => {
				const albumName = album.name;
				const albumDirectory = baseDirectory + '/' + download.validateAlbumName(albumName);

				fs.mkdir(albumDirectory, err => {
					if (err) return reject(err);

					//resolve single directory creation(for one album)
					resolve(album);

				});

			}));

			console.log('hey');
			//resolves all directories creation(for all user's albums)
			Promise.all(promises)
				.then( albums => outerResolve({
					albums,
					destFolder: baseDirectory
				}))
				.catch(outerReject);

		});
	});

}

function readDirR(dir) {
    return fs.statSync(dir).isDirectory()
        ? Array.prototype.concat(...fs.readdirSync(dir).map(f => readDirR(path.join(dir, f))))
        : dir;
}

app.get('/',function(req,res){
	res.redirect('/index.html');
});

app.get('/getAlbums',function(req,res){
	//route made to get all the user's albums and their photos and disponibilize it to download
	let accessToken = req.query.access_token,
		userID = req.query.userID,
		url = 'https://graph.facebook.com/v2.5/' + userID + 
				'/albums?fields=name,id&access_token=' + accessToken;

	console.log('Retrieving user\'s albums...');

	//fetches all user albums' information
	getAllData(url)
		.then(albums => getAllPhotosFromAlbums(albums,accessToken))
		.then(albumsWithPhotos => createFolders(albumsWithPhotos))
		.then(objResult => download.downloadAlbums(objResult.albums,objResult.destFolder))
		.then(() => {
			console.log(readDirR(__dirname + '/public/photos'))
			console.log('finished downloading files!');
			res.status(200).json({result: 'Photos downloaded!'})
		})
	// .then(albumsWithPhotos => res.json(albumsWithPhotos))
		.catch(error => {
			console.error(error);
			res.status(400).json(error)
		});

		req.on('error',console.error);
		req.on('end',console.error);
});

app.get('/download',function(req,res){
	var output;

	output = fs.createWriteStream(__dirname + '/public/zip/photos.zip');

	archive.pipe(output);
	archive.bulk([{expand: true,cwd: './public/',src:['*.*']}]);
	archive.finalize();

	//sets event listener to send file when the writing is over
	output.on('close',function(){
		res.download(__dirname + '/public/zip/photos.zip',function(err){
			if (err){
				console.log('No such file or directory!');
				res.send('0');
			}
		});
	});

});


app.listen(port,() => console.log('Listening to port ' + port + '...') );

app.use(express.static('public'));