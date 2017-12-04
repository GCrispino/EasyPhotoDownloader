const React = require('react');

class LoginPage extends React.Component{
	render(){
		return (
			<div id="loginPage" className="row">
				<button className="btn btn-light btn-lg col-md-2 col-md-offset-5" id="loginButton" onClick={this.props.handleLogin}>Login!</button>
			</div>
		);
	}
}

module.exports = LoginPage;