const React = require('react');

class LoginPage extends React.Component{
	render(){
		return (
			<div id="loginPage">
				<button className="btn btn-primary btn-lg" id="loginButton" onClick={this.props.handleLogin}>Continue with Facebook!</button>
			</div>
		);
	}
}

module.exports = LoginPage;