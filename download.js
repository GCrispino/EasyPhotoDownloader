
const download = {}

module.exports = download;

download.readURL = url =>{
	var data = "";
	var protocol = url.split("://")[0];

	return new Promise( (resolve,reject) => {
		let request = require(protocol).get(url, res => {
			res.on('data',chunk => data += chunk);

			res.on('end',() => resolve(data));

			request.on('error', e => reject(e));
		});
	});

};

download.readURLtoFile = (url,writableStream) => {
	//reads an URL and writes the received data into the 'writableStream' variable
	let protocol = url.split("://")[0];

	return new Promise( (resolve,reject) => {

	});
	let request = require(protocol).get(url)
	.then(res => {
		console.log("Writing to file on path: " + writableStream.path);
		res.on('data', chunk => writableStream.write(chunk) );

		res.on('end',() => {
			writableStream.end();

			console.log("Finished writing to file on path: " + writableStream.path);
			resolve();
		});

		request.on('error', e => reject(e.message));
	});
};

download.downloadPhoto = (photo,dest) => {
	
};

download.downloadPhotos = (photos,dest) => 
	Promise.all( photos.map( (photo,dest) => download.downloadPhoto(photo) ) );


download.downloadAlbum = (album,dest) => 
	download.downloadPhotos(album.photos,dest + '/' + album.name);

download.downloadAlbums = (albums,dest) => 
	Promise.all( albums.map( (album,dest) => download.downloadAlbum(album) ) );