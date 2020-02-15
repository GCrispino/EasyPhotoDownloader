import React from "react";
import { Button } from "semantic-ui-react";

/**
 * "Save to Drive" button component
 */
class DriveButton extends React.Component {
  constructor(props) {
    super(props);

    /**
     * API vars
     */
    this.CLIENT_ID =
      "901501021165-u55km00bs3m29v0lf8g4knccj4oacmik.apps.googleusercontent.com";
    this.API_KEY = "AIzaSyDVpcXLh35yrymzXOzfZdCMsRdUsacUYxA";
    // Array of API discovery doc URLs for APIs used by the quickstart
    this.DISCOVERY_DOCS = [
      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
    ];
    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    this.SCOPES = "https://www.googleapis.com/auth/drive.file";

    this.state = {
      signedIn: false,
      signinIn: false,
      content: undefined
    };
  }

  componentWillMount() {
    const script = document.createElement("script");

    script.src = "https://apis.google.com/js/api.js";
    script.onload = this.handleClientLoad;

    document.body.appendChild(script);
  }

  createFile = fileData => {
    console.log("createFile!!! -> ", fileData);
    const boundary = "-------314159265358979323846";
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    const title = "photos.zip";
    const { gapi } = this.state;

    var reader = new FileReader();
    reader.readAsBinaryString(fileData);

    return new Promise(resolve => {
      reader.onload = function(e) {
        var contentType = fileData.type || "application/octet-stream";
        var metadata = {
          title,
          mimeType: contentType
        };

        var base64Data = btoa(reader.result);
        var multipartRequestBody =
          delimiter +
          "Content-Type: application/json\r\n\r\n" +
          JSON.stringify(metadata) +
          delimiter +
          "Content-Type: " +
          contentType +
          "\r\n" +
          "Content-Transfer-Encoding: base64\r\n" +
          "\r\n" +
          base64Data +
          close_delim;

        var request = gapi.client.request({
          path: "/upload/drive/v2/files",
          method: "POST",
          params: { uploadType: "multipart" },
          headers: {
            "Content-Type": 'multipart/mixed; boundary="' + boundary + '"'
          },
          body: multipartRequestBody
        });

        request.execute(resolve);
      };
    });
  };

  /**
   *  On load, called to load the auth2 library and API client library.
   */
  handleClientLoad = () => {
    this.setState({ gapi: window.gapi }, function() {
      this.state.gapi.load("client:auth2", this.initClient);
    });
  };

  /**
   *  Initializes the API client library and sets up sign-in state
   *  listeners.
   */
  initClient = () => {
    const self = this,
      { gapi } = this.state;

    gapi.client
      .init({
        apiKey: self.API_KEY,
        clientId: self.CLIENT_ID,
        discoveryDocs: self.DISCOVERY_DOCS,
        scope: self.SCOPES
      })
      .then(function() {
        // Listen for sign-in state changes.
        gapi.auth2
          .getAuthInstance()
          .isSignedIn.listen(this.handleSigninStatusChange);

        // Handle the initial sign-in state.
        self.setState(
          {
            signedIn: gapi.auth2.getAuthInstance().isSignedIn.get()
          },
          function() {
            console.log("mudou: ", self.state);
          }
        );
      });
  };

  handleSigninStatusChange = isSignedIn => {
    const { createFile } = this,
      { content } = this.state,
      setState = this.setState.bind(this);

    if (!content) return;

    setState({ uploading: true }, () => {
      createFile(content).then(() => setState({ uploading: false }));
    });
  };

  handleClick = () => {
    const { contentToUpload, onFinishUpload } = this.props,
      { createFile } = this,
      { uploading } = this.state,
      setState = this.setState.bind(this);

    setState({ downloading: true });
    contentToUpload().then(content => {
      setState({ downloading: false });

      const authInstance = this.state.gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn)
        setState({ uploading: true }, () => {
          createFile(content).then(() =>
            setState({ uploading: false, content }, onFinishUpload)
          );
        });
      else authInstance.signIn();
    });
  };

  render() {
    const { downloading, uploading } = this.state,
      { displayWhenDownloading, hidden, disabled } = this.props,
      display = hidden
        ? "none"
        : downloading
        ? !displayWhenDownloading
          ? "none"
          : this.props.display
        : this.props.display;

    return (
      <Button
        fluid
        className={this.props.className}
        style={{ display }}
        disabled={disabled}
        loading={uploading}
        onClick={this.handleClick}
      >
        Save to Google Drive
      </Button>
    );
  }
}

export default DriveButton;
