const React = require('react');
const UserPage = require('./UserPage');
const LoginPage = require('./LoginPage');

class App extends React.Component{
	constructor(props){
		super(props);


		if (
			window.location.hostname === 'gcrispino.github.io' 
			&& 
			window.location.protocol === 'http:'
		)
			window.location.protocol = 'https:';

		const appId = '1684103011832056';
		
		
		this.state = {
			appId,
			loggedIn: false,
			sdkLoaded: true
		};


		this.statusChangeCallback = this.statusChangeCallback.bind(this);
	}

	componentDidMount(){
		const self = this;

		(function(d, s, id) {
			let js, fjs = d.getElementsByTagName(s)[0];
			if (d.getElementById(id)) return;
			js = d.createElement(s); js.id = id;
			js.src = `//connect.facebook.net/pt_BR/sdk.js#xfbml=1&version=v2.10&appId=${self.state.appId}`;
			fjs.parentNode.insertBefore(js, fjs);

			js.addEventListener('load',() => {
				self.setState({
					sdkLoaded: true,
					FB : window.FB
				});
			});
		})(document, 'script', 'facebook-jssdk');
	}

	// This is called with the results from from FB.getLoginStatus().
	statusChangeCallback(response) {
		// app know the current login status of the person.
		console.log('statuschange');
		
		// The response object is returned with a status field that lets the
		// Full docs on the response object can be found in the documentation
		// for FB.getLoginStatus().
		if (response.status === 'connected') {
			// Logged into your app and Facebook.
			const userId = response.authResponse.userID,
				accessToken = response.authResponse.accessToken;
	
			console.log('connected!');
			console.log(userId,accessToken);

			this.setState({
				loggedIn: true,
				userId,
				accessToken
			});

		} else if (response.status === 'not_authorized') {
			// The person is logged into Facebook, but not your app.
			document.getElementById('status').innerHTML = 'Please log ' +
			'into this app.';
		} else {
			// The person is not logged into Facebook, so we're not sure if
			// they are logged into this app or not.
			document.getElementById('status').innerHTML = 'Please log ' +
			'into Facebook.';
		}
	}

	handleLogin(){
		this.state.FB.login(this.statusChangeCallback,{scope: 'user_photos'});
	}

	render(){
		const {userId,accessToken} = this.state;
		const componentToRender = 
			this.state.sdkLoaded ?
				this.state.loggedIn 
				? <UserPage userId={userId} accessToken={accessToken} />
				: <LoginPage handleLogin={this.handleLogin.bind(this)}/>
			: <div>Loading FB info...</div>;
		return componentToRender;
	}
}

module.exports = App;
