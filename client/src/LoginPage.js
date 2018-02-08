const 
	React = require('react'),
	{Button, Icon} = require('semantic-ui-react');


class LoginPage extends React.Component{

	constructor(props) {
		super(props);
		
		this.state = {rotate: false};
	}
	

	handleClick() {
		this.setState({rotate: !this.state.rotate});
	}

	render(){

		return (
			<div id="loginPage">
				<Button color='facebook' onClick={this.props.handleLogin}>
					<Icon name='facebook' /> Continue with Facebook
				</Button>
			</div>
		);
	}
}

module.exports = LoginPage;