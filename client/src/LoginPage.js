import React from "react";
import { Button, Icon } from "semantic-ui-react";

class LoginPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = { rotate: false };
  }

  handleClick() {
    this.setState({ rotate: !this.state.rotate });
  }

  render() {
    return (
      <div id="loginPage">
        <Button color="facebook" onClick={this.props.handleLogin}>
          <Icon name="facebook" /> Continue with Facebook
        </Button>
      </div>
    );
  }
}

export default LoginPage;
