import React from "react";
import DownloadStatus from "./DownloadStatus";
import jszip from "jszip";
import Loader from "react-loader";
import { Button, Modal } from "semantic-ui-react";
import Album from "./Album";
import DriveButton from "./DriveButton";

class UserPage extends React.Component {
  constructor(props) {
    super(props);

    this.initialUserAlbums = null;

    this.state = {
      loaded: false,
      openModal: false,
      downloadInfo: {
        downloading: false,
        downloadedContentBlob: null,
        photosToDownload: null,
        downloadingAlbumIndex: null,
        downloadingPhotoIndex: null
      }
    };

    this.handleAlbumChange = this.handleAlbumChange.bind(this);
    this.handlePhotoChange = this.handlePhotoChange.bind(this);
    this.getZipFile = this.getZipFile.bind(this);
    this.downloadImages = this.downloadImages.bind(this);
    this.downloadImagesAndGetZipFile = this.downloadImagesAndGetZipFile.bind(
      this
    );
    this.downloadImagesAndSaveZipFile = this.downloadImagesAndSaveZipFile.bind(
      this
    );
    this.assignNewCheckedPhotosToArray = this.assignNewCheckedPhotosToArray.bind(
      this
    );
  }

  componentDidMount() {
    this.createInitialState()
      .then(userAlbums => {
        this.initialUserAlbums = userAlbums;
        this.setState({
          userAlbums,
          loaded: true
        });
      })
      .catch(console.error);
  }

  assignNewCheckedPhotosToArray(photos, newCheckedPhotos) {
    return photos.map((photo, i) =>
      Object.assign(photo, {
        checked: newCheckedPhotos[i]
      })
    );
  }

  createInitialState() {
    const { userId, accessToken } = this.props,
      fetchURL =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
          ? `http://localhost/getAlbums?userID=${userId}&access_token=${accessToken}`
          : `https://easy-photo-downloader.herokuapp.com/getAlbums?userID=${userId}&access_token=${accessToken}`;

    return new Promise((resolve, reject) => {
      fetch(fetchURL)
        .then(response => response.json())
        .then(albums =>
          resolve(
            albums.map((album, i) => {
              const photos = album.photos.map(photo =>
                Object.assign(photo, {
                  checked: false
                })
              );

              return {
                name: album.name,
                index: i,
                checked: false,
                photos
              };
            })
          )
        )
        .catch(reject);
    });
  }

  handleAlbumChange(e, albumIndex) {
    const { userAlbums, downloadInfo } = this.state;
    const { photos } = userAlbums[albumIndex];
    const newUserAlbums = userAlbums.map((album, i) =>
      albumIndex === i
        ? {
            ...album,
            photos: photos.map(photos => ({
              ...photos,
              checked: !album.checked
            })),
            checked: !album.checked
          }
        : album
    );
    const newDownloadInfo = {
      ...downloadInfo,
      downloadedContentBlob: null
    };

    this.setState({
      userAlbums: newUserAlbums,
      downloadInfo: newDownloadInfo
    });
  }

  handlePhotoChange(e) {
    const photoDivElem = e.target.parentNode;
    const albumIndex = parseInt(
      photoDivElem.id.match(/(\d)*-/)[0].slice(0, -1),
      10
    );
    const photoIndex = parseInt(
      photoDivElem.id.match(/-(\d)*/)[0].slice(1),
      10
    );

    const curState = this.state;
    const { photos } = curState.userAlbums[albumIndex];
    const checkedPhotos = photos.map(photo => photo.checked);
    const newCheckedPhotos = checkedPhotos.map(
      //Logical XOR
      (isPhotoChecked, i) => (i === photoIndex) !== isPhotoChecked
    );

    const newPhotos = this.assignNewCheckedPhotosToArray(
      photos,
      newCheckedPhotos
    );

    const newUserAlbums = curState.userAlbums.map((userAlbum, i) => {
      let newUserAlbum;

      if (i === albumIndex) {
        const albumChecked = newCheckedPhotos.indexOf(true) !== -1;

        newUserAlbum = {
          ...userAlbum,
          checked: albumChecked,
          photos: newPhotos
        };
      } else newUserAlbum = userAlbum;

      return newUserAlbum;
    });

    const { downloadInfo } = this.state;
    const newDownloadInfo = {
      ...downloadInfo,
      downloadedContentBlob: null
    };

    this.setState({
      userAlbums: newUserAlbums,
      downloadInfo: newDownloadInfo
    });
  }

  fetchPhoto(photo) {
    return new Promise((resolve, reject) => {
      fetch(photo.images[0].source)
        .then(response => response.blob())
        .then(blob =>
          resolve({
            name: `${photo.id}.jpg`,
            blob
          })
        )
        .catch(reject);
    });
  }

  //Filter photos checked by user to download
  filterCheckedPhotos(userAlbums) {
    return userAlbums
      .filter(album => album.checked) //gets checked albums
      .map(checkedAlbum => {
        /*
         * maps checked albums in state to objects that contain the
         * checked photos' urls
         */
        const newCheckedAlbum = {
          name: checkedAlbum.name,
          index: checkedAlbum.index,
          checked: checkedAlbum.checked
        };

        //fetch the checked photos from 'this.state.userAlbums'
        newCheckedAlbum.photos = checkedAlbum.photos
          .map(photo => photo.checked)
          .map((checkedPhoto, photoIndex) => {
            if (checkedPhoto) {
              const photoObject = this.state.userAlbums[checkedAlbum.index]
                .photos[photoIndex];
              return Object.assign(photoObject, { downloaded: false });
            }
            return null;
          })
          .filter(photo => (photo ? photo.checked : null)); //exclude undefineds

        return newCheckedAlbum;
      });
  }

  markPhotoAsDownloaded(photoIndex, albumIndex, photosToDownload) {
    return photosToDownload.map((album, i) => {
      return albumIndex === i
        ? Object.assign(album, {
            photos: album.photos.map((photo, j) =>
              photoIndex === j
                ? Object.assign(photo, { downloaded: true })
                : photo
            )
          })
        : album;
    });
  }

  //downloads images and saves them to user
  downloadImages() {
    const { userAlbums } = this.state;
    const checkedPhotos = this.filterCheckedPhotos(userAlbums);
    const promises = [];
    const { downloadInfo } = this.state;

    if (checkedPhotos.length === 0) {
      this.setState({
        downloadInfo: {
          ...downloadInfo,
          downloading: false
        }
      });
      return Promise.reject("No photos selected");
    }

    return new Promise(resolve => {
      this.setState(
        {
          downloadInfo: {
            ...downloadInfo,
            downloading: true,
            photosToDownload: checkedPhotos
          }
        },
        () => {
          checkedPhotos.forEach((album, i) => {
            promises.push(
              new Promise((resolve, reject) => {
                Promise.all(
                  album.photos.map(
                    (photo, j) =>
                      new Promise((resolve, reject) => {
                        // this.fetchPhotoToZipFolder(photo,folder)
                        this.fetchPhoto(photo)
                          .then(photoData => {
                            const newPhotosToDownload = this.markPhotoAsDownloaded(
                              j,
                              i,
                              this.state.downloadInfo.photosToDownload
                            );
                            const newDownloadInfo = Object.assign(
                              this.state.downloadInfo,
                              { photosToDownload: newPhotosToDownload }
                            );
                            this.setState({ downloadInfo: newDownloadInfo });
                            resolve(photoData);
                          })
                          .catch(reject);
                      })
                  )
                )
                  .then(albumPhotosData => {
                    resolve({
                      name: album.name,
                      photos: albumPhotosData
                    });
                  })
                  .catch(reject);
              })
            );
          });

          resolve(Promise.all(promises));
        }
      );
    });
  }

  getZipFile = downloadedAlbumsInfo => {
    const zip = new jszip();

    downloadedAlbumsInfo.forEach(albumInfo => {
      const folder = zip.folder(albumInfo.name);

      albumInfo.photos.forEach(photoData =>
        folder.file(photoData.name, photoData.blob)
      );
    });

    const { downloadInfo } = this.state;
    return zip.generateAsync({ type: "blob" }).then(content => {
      this.setState({
        downloadInfo: {
          downloading: false,
          downloadedContentBlob: content,
          photosToDownload: this.state.photosToDownload
        }
      });

      return Promise.resolve(content);
    });
  };

  downloadImagesAndGetZipFile = () =>
    this.downloadImages()
      .then(this.getZipFile)
      .catch(console.error);

  downloadImagesAndSaveZipFile() {
    this.downloadImages()
      .then(this.getZipFile)
      .then(content => {
        this.setState({
          downloadInfo: {
            downloading: false,
            downloadedContentBlob: content,
            photosToDownload: this.state.photosToDownload
          }
        });

        const aElement = document.createElement("a");
        const objectURL = URL.createObjectURL(content);

        aElement.style.display = "none";
        aElement.href = objectURL;
        aElement.download = "photos.zip";

        document.body.appendChild(aElement);

        aElement.click();
      })
      .catch(err => {
        this.setState({
          downloadInfo: {
            downloading: false,
            photosToDownload: this.state.photosToDownload
          }
        });
        console.error(err);
      });
  }

  getDownloadedPhotos() {
    const { photosToDownload } = this.state.downloadInfo;

    return photosToDownload
      .map(album => album.photos)
      .reduce((a, b) => a.concat(b), [])
      .filter(photo => photo.downloaded);
  }

  closeModal = () => this.setState({ openModal: false });

  render() {
    const albums = this.state.loaded
      ? this.state.userAlbums.map((album, i) => (
          <Album
            key={i}
            index={i}
            name={album.name}
            photos={album.photos}
            checked={album.checked}
            onAlbumChange={this.handleAlbumChange}
            onPhotoChange={this.handlePhotoChange}
          />
        ))
      : null;

    const { downloadInfo, openModal } = this.state,
      { downloadedContentBlob } = downloadInfo;

    return (
      <div>
        {this.state.loaded ? (
          <div>
            {downloadInfo.downloading ? (
              <DownloadStatus
                photosToDownload={downloadInfo.photosToDownload}
              />
            ) : (
              <React.Fragment>
                <form id="albumList">{albums}</form>
                <Button
                  fluid
                  onClick={this.downloadImagesAndSaveZipFile}
                  className="downloadButton"
                >
                  Download Photos!
                </Button>
              </React.Fragment>
            )}

            {/* <DriveButton
						hidden={downloadInfo.downloading}
						disabled={this.state.userAlbums && this.filterCheckedPhotos(this.state.userAlbums).length === 0}
						className='saveToDriveButton'
						displayWhenDownloading={false}
						display='block'
						contentToUpload={
							downloadedContentBlob ?
								() => Promise.resolve(downloadedContentBlob)
								: this.downloadImagesAndGetZipFile
						}
						onFinishUpload={() => this.setState({openModal: true})}
					/> */}
          </div>
        ) : (
          <div>
            <Loader />
            <div style={{ textAlign: "center" }}>Loading...</div>
          </div>
        )}

        <Modal size="small" open={openModal} onClose={this.closeModal}>
          <Modal.Header>Photos uploaded to Google Drive!</Modal.Header>
          <Modal.Actions>
            <Button
              negative
              icon="remove"
              labelPosition="right"
              content="Close"
              onClick={this.closeModal}
            />
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

export default UserPage;
