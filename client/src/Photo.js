import React from "react";
import { Button, Modal } from "semantic-ui-react";

class Photo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false
    };
    this.displayImage = this.displayImage.bind(this);
    this.close = this.close.bind(this);
  }

  open(e) {
    e.preventDefault();
    this.setState({ open: true });
  }

  close(e) {
    e.preventDefault();
    this.setState({ open: false });
  }

  previewImage(e) {
    e.preventDefault();
  }

  displayImage() {}

  render() {
    const smallestImage = this.props.images[this.props.images.length - 1],
      { open } = this.state;

    this.handleClick = this.props.onClick;

    return (
      <div
        id={this.props.id}
        className="photo"
        onChange={this.props.handleChange}
      >
        <label>
          {this.props.name ? this.props.name : "*Photo without title*"}
        </label>
        <input type="checkbox" checked={this.props.checked} />
        <Button className="photoButton" onClick={this.open.bind(this)}>
          Preview
        </Button>

        <Modal size="small" open={open} onClose={this.close}>
          <Modal.Header>{this.props.name}</Modal.Header>
          <Modal.Content style={{ textAlign: "center" }}>
            <img
              src={smallestImage.source}
              alt={this.props.name}
              width={smallestImage.width}
              height={smallestImage.height}
              onClick={this.displayImage}
            />
          </Modal.Content>
          <Modal.Actions>
            <Button
              negative
              icon="remove"
              labelPosition="right"
              content="Close"
              onClick={this.close}
            />
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

export default Photo;
