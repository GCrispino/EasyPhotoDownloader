const React = require('react');

class LoginPage extends React.Component{
	render(){
		return (
			<div id="loginPage">
				<button onClick={this.props.handleLogin}>Login!</button>
			</div>
		);
	}
}

module.exports = LoginPage;