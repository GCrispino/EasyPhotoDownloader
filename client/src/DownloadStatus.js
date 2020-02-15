import React from "react";
import Loader from "react-loader";

function getDownloadedPhotos(photosToDownload) {
  return photosToDownload
    .map(album => album.photos)
    .reduce((a, b) => a.concat(b), [])
    .filter(photo => photo.downloaded);
}

export default function(props) {
  const { photosToDownload } = props;
  const nAllPhotos = photosToDownload
    .map(album => album.photos)
    .reduce((a, b) => a.concat(b), []).length;

  const downloadedPhotos = getDownloadedPhotos(photosToDownload);
  return (
    <div className="downloadStatus">
      <Loader />
      <h3>Downloading...(please wait)</h3>
      <h4>
        {downloadedPhotos.length} / {nAllPhotos} photos
      </h4>
    </div>
  );
}
