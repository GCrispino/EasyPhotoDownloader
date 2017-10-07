const React = require('react');
const Album = require('./Album');
const jszip = require('jszip');


class UserPage extends React.Component{
	constructor(props){
		super(props);

		this.createInitialState()
		.then( userAlbums => this.setState({userAlbums}) )
		.catch(console.error);
		

		this.handleAlbumChange = this.handleAlbumChange.bind(this);
		this.handlePhotoChange = this.handlePhotoChange.bind(this);
		this.downloadImages = this.downloadImages.bind(this);
		this.assignNewSelectedPhotosToPhotoArray = this.assignNewSelectedPhotosToPhotoArray.bind(this);
	}

	assignNewSelectedPhotosToPhotoArray(photos,newSelectedPhotos){
		return photos.map( (photo,i) => Object.assign(photo,{selected: newSelectedPhotos[i]}) );
	}

	createInitialState(){
		const {userId,accessToken} = this.props;

		return new Promise((resolve,reject) => {
			fetch(`https://easy-photo-downloader.herokuapp.com/getAlbums?userID=${userId}&access_token=${accessToken}`)
			.then(response => response.json())
			.then(albums => 
				resolve(
					albums.map(
						(album,i) => {
							const photos = album.photos.map(photo => Object.assign(photo,{selected: false}));

								return {
									name: album.name,
									index: i,
									selected: false,
									photos
								};
						}
					)
				)
			)
			.catch(reject);	
		});
	}

	handleAlbumChange(e){
		const albumInputElem = e.target;
		const albumIndex = parseInt(albumInputElem.id.match(/(\d)+/g)[0]);
		const albumPhotosElems = albumInputElem.parentNode.nextSibling.childNodes;
		const isAlbumChecked = albumInputElem.checked;
		const userAlbums = this.state.userAlbums;
		const {photos} = userAlbums[albumIndex];
		

		const newSelectedPhotos = Array.prototype.map.call(
			albumPhotosElems,
			albumPhotosElem => {
				//checks input elements
				albumPhotosElem.querySelector('input').checked = isAlbumChecked;
				
				return isAlbumChecked;
			}
		);

		const newPhotos = this.assignNewSelectedPhotosToPhotoArray(photos,newSelectedPhotos);

		const newUserAlbums = userAlbums.map(
									(album,i) => e.target.id === 'album' + i 
										? {
											name: album.name,
											index: album.index,
											selected: e.target.checked,
											photos: newPhotos
										} 
										: album
								);


		this.setState({
			userAlbums: newUserAlbums
		});

	}

	handlePhotoChange(e){
		const photoDivElem = e.target.parentNode.parentNode;
		
		const albumIndex = parseInt(photoDivElem.id.match(/(\d)*-/)[0].slice(0,-1));
		const photoIndex = parseInt(photoDivElem.id.match(/-(\d)*/)[0].slice(1));

		const albumInputElem = document.getElementById(`album${albumIndex}`);
		
		const curState = this.state;
		const {photos} = curState.userAlbums[albumIndex];
		const selectedPhotos = photos.map(photo => photo.selected);
		const newSelectedPhotos = selectedPhotos.map(
			//Logical XOR
			(isPhotoSelected,i) => (i === photoIndex) !== isPhotoSelected
		);
		
		const newPhotos = this.assignNewSelectedPhotosToPhotoArray(photos,newSelectedPhotos);
		
		const newUserAlbums = curState.userAlbums.map(
			(userAlbum,i) => {
				let newUserAlbum;
				
				if (i === albumIndex) {
					const albumSelected = newSelectedPhotos.indexOf(true) !== -1;
					//checks or unchecks album input element
					albumInputElem.checked = albumSelected;
					
					newUserAlbum = {
						name: userAlbum.name,
						index: userAlbum.index,
						selected: albumSelected,
						photos: newPhotos
					};
				}
				else newUserAlbum = userAlbum;


				return newUserAlbum;
			}
		);

		this.setState({
			userAlbums: newUserAlbums
		});

	}

	fetchPhotosToZipFolder(photo,folder){
		console.log('fetching photo...');
		console.log(`id: ${photo.id}`);
		return new Promise((resolve,reject) => {
			fetch(photo.images[0].source)
			.then(response => response.blob())
			.then(blob => {
				console.log('photo fetched');
				folder.file(`${photo.id}.jpg`,blob);
				resolve();
			})
			.catch(reject);
		});
	}

	//Filter photos selected by user to download
	filterSelectedPhotos(userAlbums){
		return userAlbums
		.filter(album => album.selected)//gets selected albums
		.map(selectedAlbum => { 
			/*
			 * maps selected albums in state to objects that contain the 
			 * selected photos' urls
			 */
			const newSelectedAlbum = {
				name: selectedAlbum.name,
				index: selectedAlbum.index,
				selected: selectedAlbum.selected	
			};
			
			//fetch the selected photos from 'this.state.userAlbums'
			newSelectedAlbum.photos = 
				// selectedAlbum.selectedPhotos
				selectedAlbum.photos
				.map(photo => {console.log(photo);return photo.selected;})
				.map((selectedPhoto,photoIndex) => {
					if (selectedPhoto)
						return this.state.userAlbums[selectedAlbum.index].photos[photoIndex];
					return null;
				})
				.filter(photo => photo ? photo.selected : null); //exclude undefineds

			return newSelectedAlbum;
		});

	}

	//downloads images and saves them to user
	downloadImages(){
		const {userAlbums} = this.state;
		const selectedPhotos = this.filterSelectedPhotos(userAlbums);
		const zip = new jszip();
		const promises = [];

		selectedPhotos.forEach(album => {
			const folder = zip.folder(album.name);
			
			promises.push(
				Promise.all(album.photos.map(photo => this.fetchPhotosToZipFolder(photo,folder)))
			);
		});
		
		Promise.all(promises)
		.then(() => {
			zip.generateAsync({type:'blob'})
			.then( content => {
				const aElement = document.createElement('a');
				const objectURL = URL.createObjectURL(content);
				
				aElement.href = objectURL;
				aElement.download = 'photos.zip';
				aElement.click();
			})
			.catch(console.error);
		})
		.catch(console.error);

		
	}
	
	render(){

		const albums = this.state ? (this.state.userAlbums.map(
			(album,i) => (
			
				<Album 
					key={i}
					index={i}
					name={album.name}
					photos={album.photos}
					onAlbumChange={this.handleAlbumChange}
					onPhotoChange={this.handlePhotoChange}
				/>
			
			))
		) : null;

        return (
			<div>
				<form id="albumList">{albums}</form>
				<button className="btn btn-primary" onClick={this.downloadImages}>Download</button>
			</div>
		);
	}
}

module.exports = UserPage;