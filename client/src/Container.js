



const React = require('react');
const Album = require('./Album');

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
				album => ({
					name: album.name,
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


	downloadImages(){
		console.log('downloading images.....');
		console.log(this.state);
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