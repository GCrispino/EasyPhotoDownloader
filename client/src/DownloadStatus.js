const React = require('react');

class DownloadStatus extends React.Component{
	getDownloadedPhotos(){
		const {photosToDownload} = this.props;

		return photosToDownload
		.map(album => album.photos)
		.reduce((a,b) => a.concat(b),[])
		.filter(photo => photo.downloaded);
	}

	render(){
		const nAllPhotos = 
			this.props.photosToDownload.map(album => album.photos)
			.reduce((a,b) => a.concat(b),[])
			.length;

		const downloadedPhotos = this.getDownloadedPhotos();
			return (
				<div>
					Downloading...(please wait)
					<div>{downloadedPhotos.length} / {nAllPhotos} photos</div>
				</div>
			);
		}
}

module.exports = DownloadStatus;