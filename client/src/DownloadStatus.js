const React = require('react');
const Loader = require('react-loader');

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
				<div className="downloadStatus">
					<Loader /> 
					<h3>Downloading...(please wait)</h3>
					<h4>{downloadedPhotos.length} / {nAllPhotos} photos</h4>
				</div>
			);
		}
}

module.exports = DownloadStatus;