const express = require('express');
const fs = require('fs');
const archiver = require('archiver');
const download = require('./download');

const app = express();
const port = process.env.PORT || 80;

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "https://gcrispino.github.io");
	// res.header("Access-Control-Allow-Origin", "*");
	// res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

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

function sendToClient(userID,res){
	let output;

	try {
		//checks if directory exists
		fs.accessSync(__dirname + '/zip');
	} catch (e) {
		//if it doesn't exist, it gets created
		fs.mkdirSync(__dirname + '/zip');
	}

	return new Promise((resolve,reject) => {
		output = fs.createWriteStream(__dirname + '/zip/photos.zip');

		let archive = archiver('zip');
		archive.pipe(output);
		archive.directory(__dirname + `/public/photos/${userID}`,'Photos');
		archive.finalize();

		//sets event listener to send file when the writing is over
		output.on('close',function(){
			res.download(__dirname + '/zip/photos.zip',function(err){
				if (err){
					console.log('No such file or directory!');
					return reject(err);
				}
				else return resolve();
			});
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


function getAllPhotosFromAlbums(albums,accessToken){
	return Promise.all(albums.map(album => getAllPhotosFromAlbum(album,accessToken)));
}

function createFolders(albums,userID){
	const baseDirectory = __dirname + '/public/photos/' + userID;

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
	console.log('url: ',url);
	//fetches all user albums' information
	getAllData(url)
		.then(albums => getAllPhotosFromAlbums(albums,accessToken))
		// .then(albumsWithPhotos => createFolders(albumsWithPhotos,userID))
		// .then(objResult => download.downloadAlbums(objResult.albums,objResult.destFolder))
		// .then(() => {
			// console.log('finished downloading files!');
			// return sendToClient(userID,res);
			// res.status(200).json({result: 'Photos downloaded!'})
		// })
		// .then(() => console.log('files sent to client!'))
		.then(albumsWithPhotos => res.json(albumsWithPhotos))
		.catch(error => {
			console.error(error);
			res.status(400).json(error);
		});

	req.on('error',console.error);
	req.on('end',console.error);
});

app.listen(port,() => console.log('Listening to port ' + port + '...') );

app.use(express.static('public'));