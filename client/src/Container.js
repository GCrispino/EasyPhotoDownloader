const React = require('react');
const Album = require('./Album');
const jszip = require('jszip');

class Container extends React.Component{
	constructor(props){
		super(props);

		this.state = this.createInitialState();

		this.handleAlbumChange = this.handleAlbumChange.bind(this);
		this.handlePhotoChange = this.handlePhotoChange.bind(this);
		this.downloadImages = this.downloadImages.bind(this);

	}

	createInitialState(){
		return {
			userAlbums: this.props.albums.map(
				(album,i) => ({
					name: album.name,
					index: i,
					selected: false,
					selectedPhotos: Array(album.photos.length).fill(false)
				})
			)
		}
	}

	albumHasPhotoSelected(selectedPhotos){
		return selectedPhotos.indexOf(true) !== -1;
	}

	handleAlbumChange(e){
		const albumInputElem = e.target;
		const albumPhotosElems = albumInputElem.parentNode.nextSibling.childNodes;
		const isAlbumChecked = albumInputElem.checked;
		const userAlbums = this.state.userAlbums;

		const newSelectedPhotos = Array.prototype.map.call(
			albumPhotosElems,
			albumPhotosElem => {
				//checks input elements
				albumPhotosElem.querySelector('input').checked = isAlbumChecked;
				
				return isAlbumChecked;
			}
		);

		const newUserAlbums = userAlbums.map(
									(album,i) => e.target.id === 'album' + i 
										? {
											name: album.name,
											index: album.index,
											selected: e.target.checked,
											selectedPhotos: newSelectedPhotos
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

		const newSelectedPhotos = curState.userAlbums[albumIndex].selectedPhotos.map(
			//Logical XOR
			(isPhotoSelected,i) => (i === photoIndex) !== isPhotoSelected
		);

		const newUserAlbums = curState.userAlbums.map(
			(userAlbum,i) => {
				let newUserAlbum;
				
				if (i === albumIndex) {
					const albumSelected = this.albumHasPhotoSelected(newSelectedPhotos);
					//checks or unchecks album input element
					albumInputElem.checked = albumSelected;
					
					newUserAlbum = {
						name: userAlbum.name,
						index: userAlbum.index,
						selected: albumSelected,
						selectedPhotos: newSelectedPhotos
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
		console.log('fetching photo...')
		console.log(`id: ${photo.id}`);
		return new Promise((resolve,reject) => {
			fetch(photo.images[0].source)
			.then(response => response.blob())
			.then(blob => {
				console.log('photo fetched');
				folder.file(`${photo.id}.jpg`,blob);
				resolve();
			})
			.catch(reject)
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

			//fetch the selected photos from 'this.props.albums'
			newSelectedAlbum.photos = 
				selectedAlbum.selectedPhotos
				.map((selectedPhoto,photoIndex) => {
					if (selectedPhoto)
						return this.props.albums[selectedAlbum.index].photos[photoIndex];
				})
				.filter(selectedPhoto => selectedPhoto); //exclude undefineds

			return newSelectedAlbum;
		});

	}

	//downloads images and saves them to user
	downloadImages(){
		const {userAlbums} = this.state;
		const selectedPhotos = this.filterSelectedPhotos(userAlbums);
		const zip = new jszip();
		const promises = [];

		console.log('photos: ',selectedPhotos);
		
		selectedPhotos.forEach(album => {
			console.log('album: ',album);
			console.log(album.photos);
			console.log(this.state.userAlbums);
			const folder = zip.folder(album.name);
			
			promises.push(
				Promise.all(album.photos.map(photo => this.fetchPhotosToZipFolder(photo,folder)))
			);
		});
		
		Promise.all(promises)
		.then(() => {
			console.log('acabou');
			zip.generateAsync({type:"blob"})
			.then( content => {
				const aElement = document.createElement('a');
				const objectURL = URL.createObjectURL(content);
				
				aElement.href = objectURL
				aElement.download = 'photos.zip';
				aElement.click();
			});
		})

		
	}
	
	render(){
		
		const albums = this.props.albums.map(
			(album,i) => (
			
				<Album 
					key={i}
					index={i}
					name={album.name}
					photos={album.photos}
					onAlbumChange={this.handleAlbumChange}
					onPhotoChange={this.handlePhotoChange}
				/>
			
			)
		);

        return (
			<div>
				<form id="albumList">{albums}</form>
				<button className="btn btn-primary" onClick={this.downloadImages}>Download</button>
			</div>
		);
	}
}

module.exports = Container;