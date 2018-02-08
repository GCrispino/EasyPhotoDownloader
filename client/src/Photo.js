const React = require('react');
const {Button,Modal} = require('semantic-ui-react');

//CHANGE IMAGE PREVIEW SIZE 
class Photo extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			open: false
		};
		this.displayImage = this.displayImage.bind(this);
		this.close = this.close.bind(this);
	}

	test(e){
		e.preventDefault();
		this.setState({ open: true });		
	}

	close(e){
		e.preventDefault();
		this.setState({ open: false });		
	}

	previewImage(e){
		e.preventDefault();
	}

	displayImage(){
	}

	render(){
		const smallestImage = this.props.images[this.props.images.length - 1],
			{open} = this.state;

		this.handleClick = this.props.onClick;

		return (
			<div 
				id={this.props.id} 
				className="photo" 
				onChange={this.props.handleChange}
			>
				
				<label>
					{this.props.name ? this.props.name : '*Photo without title*'}
				</label>
				<input type="checkbox" />
				<Button className='photoButton' onClick={this.test.bind(this)}>Preview</Button>
 
				<Modal size='small' open={open} onClose={this.close}>
					<Modal.Header>
						{this.props.name}
					</Modal.Header>
					<Modal.Content style={{textAlign: 'center'}} >
						<img
							src={smallestImage.source}
							alt={this.props.name}
							width={smallestImage.width}
							height={smallestImage.height}
							onClick={this.displayImage}
						/>
					</Modal.Content>
					<Modal.Actions>
						<Button negative icon='remove' labelPosition='right' content='Close' onClick={this.close}/>
					</Modal.Actions>
				</Modal>
				
			</div>
		);
	}

}

module.exports = Photo;