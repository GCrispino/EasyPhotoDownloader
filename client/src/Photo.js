const React = require('react');
const ReactDOM = require('react-dom');

class Photo extends React.Component{
	constructor(props){
		super(props);
	}

	displayImage(){
		console.log('displaying image!');
	}

	render(){
		const image = this.props.image;

		this.handleClick = this.props.onClick;

		return (
			<img
				src={image.src}
				width={image.width}
				height={image.height}
				onClick={this.displayImage}
			/>
		);
	}

}

module.exports = Photo;