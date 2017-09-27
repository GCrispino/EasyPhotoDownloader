const fs = require('fs');
const http = require('http');
const https = require('https');

http.globalAgent.maxSockets = https.globalAgent.maxSockets = 25;

const download = {};

module.exports = download;


download.validateAlbumName = albumName => {
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
		return albumName.replace(/(\.*|\s*|(\.*\s*)*|(\s*\.*)*)$/,'');
	}
	else
		return albumName;
}

download.readURL = url =>{
	let data = '';
	let protocol = url.split('://')[0];
	let packag;

	switch(protocol){
		case 'http':
			packag = http;
		case 'https':
			packag = https;
	}

	return new Promise( (resolve,reject) => {
		let request = packag.get(url, res => {
			res.on('data',chunk => data += chunk);

			res.on('end',() => resolve(data));

			request.on('error', e => reject(e));
		});
	});

};

download.readURLtoFile = (url,destPath) => {
	//reads an URL and writes the received data into the 'writableStream' variable
	let protocol = url.split('://')[0];
	let packag;

	switch(protocol){
		case 'http':
			packag = http;
		case 'https':
			packag = https;
	}


	const fileWriteStream = fs.createWriteStream(destPath);

	return new Promise( (resolve,reject) => {
		let request = packag.get(url,res => {
				console.log('Writing to file on path: ' + fileWriteStream.path);
				res.on('data', chunk => fileWriteStream.write(chunk) );

				res.on('end',() => {
					fileWriteStream.end();

					console.log('Finished writing to file on path: ' + fileWriteStream.path);
					resolve();
				});

				request.on('error', e => reject(e.message));
			});
	});
};

download.downloadPhoto = (photo,dest) => {
	const fileName = photo.id;
	const photoURL = photo.images[0].source;
	const fileDestination = dest + '/' + fileName + '.jpg';

	console.log(`Downloading photo: url: ${photoURL} to ${fileDestination}: `);

	return download.readURLtoFile(photoURL,fileDestination);
};

download.downloadPhotos = (photos,dest) =>
	Promise.all( photos.map( photo => download.downloadPhoto(photo,dest) ) );


download.downloadAlbum = (album,dest) => {
	console.log('Downloading album ' + album.name + '...');
	return download.downloadPhotos(album.photos,dest + '/' + download.validateAlbumName(album.name));
}


download.downloadAlbums = (albums,dest) => 
	Promise.all( albums.map( album => download.downloadAlbum(album,dest) ) );
