const React = require('react');
const {Button} = require('semantic-ui-react');

/** 
 * "Save to Drive" button component
*/
class DriveButton extends React.Component {
	constructor(props) {
		super(props);
	
		/**
		 * API vars
		 */
		// this.CLIENT_ID = '901501021165-miaastoqf2med8uh87ekqfe1dka0ucql.apps.googleusercontent.com';
		this.CLIENT_ID = '901501021165-u55km00bs3m29v0lf8g4knccj4oacmik.apps.googleusercontent.com';
		this.API_KEY = 'AIzaSyDVpcXLh35yrymzXOzfZdCMsRdUsacUYxA';
		// Array of API discovery doc URLs for APIs used by the quickstart
		this.DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
		// Authorization scopes required by the API; multiple scopes can be
		// included, separated by spaces.
		this.SCOPES = 'https://www.googleapis.com/auth/drive.file';

		this.state = {
			signedIn: false,
			signinIn: false,
			content: undefined
		};
	}
	
	componentWillMount(){
		const script = document.createElement('script');

		script.src = 'https://apis.google.com/js/api.js';
		script.onload = this.handleClientLoad;

		document.body.appendChild(script);
	}

	createFile = (content) => {
		console.log('Create file!!!')
		console.log('content: ',content);
	}

	/**
      *  On load, called to load the auth2 library and API client library.
      */
    handleClientLoad = () => {
		this.setState({ gapi: window.gapi }, function(){ 
			this.state.gapi.load('client:auth2', this.initClient);
		});
	}

	/**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
       */
    initClient = () => {
		const self = this,
			{gapi} = this.state;

		gapi.client.init({
			apiKey: self.API_KEY,
			clientId: self.CLIENT_ID,
			discoveryDocs: self.DISCOVERY_DOCS,
			scope: self.SCOPES
		}).then(function () {
			// Listen for sign-in state changes.
			// gapi.auth2.getAuthInstance().isSignedIn.listen( isSignedIn => {
			// 	console.log('mudou! -> ',isSignedIn);
			// 	self.setState({signedIn: isSignedIn});
			// });
			gapi.auth2.getAuthInstance().isSignedIn.listen(this.handleSigninStatusChange);

			// Handle the initial sign-in state.
			self.setState({
				signedIn: gapi.auth2.getAuthInstance().isSignedIn.get()
			},function(){
				console.log('mudou: ',self.state);
			});
		});
	}

	handleSigninStatusChange = (isSignedIn) => {
		const {content} = this.state;

		if (!content)
			return;

		this.createFile(content); //draft for now
	}

	handleClick = () => {

		const 
			{contentToUpload} = this.props,
			{createFile} = this;

		contentToUpload()
		.then(content => {
			const authInstance = this.state.gapi.auth2.getAuthInstance();
			if (authInstance.isSignedIn)
				createFile(content);
			else
				authInstance.signIn();
		});

	}

	render() {
		return (
			<Button onClick={this.handleClick}>
				Save to Google Drive
			</Button>
		);
	}
}

module.exports = DriveButton;