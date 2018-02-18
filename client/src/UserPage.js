const React = require('react');
const Album = require('./Album');
const DownloadStatus = require('./DownloadStatus');
const jszip = require('jszip');
const Loader = require('react-loader');
const { Button } = require('semantic-ui-react');

class UserPage extends React.Component{
	constructor(props){
		super(props);

		this.initialUserAlbums = null;

		this.state = ({
			loaded: false,
			downloadInfo: {
				downloading: false,
				photosToDownload: null,
				downloadingAlbumIndex: null,
				downloadingPhotoIndex: null
			}
		});

		this.handleAlbumChange = this.handleAlbumChange.bind(this);
		this.handlePhotoChange = this.handlePhotoChange.bind(this);
		this.downloadImages = this.downloadImages.bind(this);
		this.assignNewSelectedPhotosToPhotoArray = this.assignNewSelectedPhotosToPhotoArray.bind(this);
	}

	componentDidMount(){
		this.createInitialState()
		.then( userAlbums => {
				this.initialUserAlbums = userAlbums;
				this.setState({
					userAlbums,
					loaded: true
				});
		})
		.catch(console.error);
		
	}

	assignNewSelectedPhotosToPhotoArray(photos,newSelectedPhotos){
		return photos.map( (photo,i) => Object.assign(photo,{selected: newSelectedPhotos[i]}) );
	}

	createInitialState(){
		const 
			{userId,accessToken} = this.props,
			fetchURL = 
				window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
				? `http://localhost/getAlbums?userID=${userId}&access_token=${accessToken}`
				: `https://easy-photo-downloader.herokuapp.com/getAlbums?userID=${userId}&access_token=${accessToken}`;

		return new Promise((resolve,reject) => {
			fetch(fetchURL)
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
		const albumIndex = parseInt(albumInputElem.id.match(/(\d)+/g)[0],10);
		const albumPhotosElems = albumInputElem.nextSibling.firstChild.childNodes;
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
		const photoDivElem = e.target.parentNode;
		const albumIndex = parseInt(photoDivElem.id.match(/(\d)*-/)[0].slice(0,-1),10);
		const photoIndex = parseInt(photoDivElem.id.match(/-(\d)*/)[0].slice(1),10);

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

	fetchPhotoToZipFolder(photo,folder){
		return new Promise((resolve,reject) => {
			fetch(photo.images[0].source)
			.then(response => response.blob())
			.then(blob => {
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
				.map(photo => photo.selected)
				.map((selectedPhoto,photoIndex) => {
					if (selectedPhoto){
						const photoObject = this.state.userAlbums[selectedAlbum.index].photos[photoIndex];
						return Object.assign(photoObject,{downloaded: false});
					}
					return null;
				})
				.filter(photo => photo ? photo.selected : null); //exclude undefineds

			return newSelectedAlbum;
		});

	}

	markPhotoAsDownloaded(photoIndex,albumIndex,photosToDownload){
		return photosToDownload
		.map((album,i) => {
			return albumIndex === i ?
				Object.assign(album,{
					photos: album.photos.map((photo,j) => 
						photoIndex === j
						? Object.assign(photo,{downloaded: true})
						: photo
					)
				})
				: album;
		});
	}

	//downloads images and saves them to user
	downloadImages(){
		const {userAlbums} = this.state;
		const selectedPhotos = this.filterSelectedPhotos(userAlbums);
		const zip = new jszip();
		const promises = [];
		

		if (selectedPhotos.length === 0){
			this.setState({downloading: false});
			return ;
		}

		this.setState({
			downloadInfo: {
				downloading: true,
				photosToDownload: selectedPhotos,
				downloadingAlbumIndex: null,
				downloadingPhotoIndex: null
			}
		},() => {
			selectedPhotos.forEach((album,i) => {
				const folder = zip.folder(album.name);
				
				promises.push(
	
					Promise.all(album.photos.map((photo,j) => 
						new Promise((resolve,reject) => {

							this.fetchPhotoToZipFolder(photo,folder)
							.then(() => {
								const newPhotosToDownload = this.markPhotoAsDownloaded(j,i,this.state.downloadInfo.photosToDownload);
								const newDownloadInfo = Object.assign(this.state.downloadInfo,{photosToDownload: newPhotosToDownload});
								this.setState({downloadInfo: newDownloadInfo});
								resolve();
							})
							.catch(reject);
						})
					))
	
				);
			});
			
			Promise.all(promises)
			.then(() => {
				zip.generateAsync({type:'blob'})
				.then( content => {
					const aElement = document.createElement('a');
					const objectURL = URL.createObjectURL(content);
				
					aElement.style.display = 'none';
					aElement.href = objectURL;
					aElement.download = 'photos.zip';
	
					document.body.appendChild(aElement);
	
					aElement.click();
					this.setState({
						userAlbums: this.initialUserAlbums,
						downloadInfo: {
							downloading: false,
							photosToDownload: this.state.photosToDownload
						}
					});
			
				})
				.catch(err => {
					this.setState({
						userAlbums: this.initialUserAlbums,
						downloadInfo: {
							downloading: false,
							photosToDownload: this.state.photosToDownload
						}
					});
					console.error(err);
				});
			})
			.catch(err => {
				this.setState({
					userAlbums: this.initialUserAlbums,
					downloadInfo: {
						downloading: false,
						photosToDownload: this.state.photosToDownload
					}
				});
				console.error(err);
			});
			
		});
		
	}

	getDownloadedPhotos(){
		const {photosToDownload} = this.state.downloadInfo;

		return photosToDownload
		.map(album => album.photos)
		.reduce((a,b) => a.concat(b),[])
		.filter(photo => photo.downloaded);
	}

	render(){
		const {downloadInfo} = this.state;
		if (downloadInfo.downloading){
			return <DownloadStatus 
						photosToDownload={downloadInfo.photosToDownload}
					/>;
		}

		const albums = this.state.loaded ? (this.state.userAlbums.map(
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
				this.state.loaded ?
				<div>
						<form id="albumList">{albums}</form>
					<Button onClick={this.downloadImages} className='downloadButton'>
						Download Photos!
					</Button>
					</div>
				: <div>
						<Loader />
						<div style={{ textAlign: 'center' }}>Loading...</div>
					</div>
		);
	}
}

module.exports = UserPage;
