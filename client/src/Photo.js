const React = require('react');

class Photo extends React.Component{
	constructor(props){
		super(props);

		this.displayImage = this.displayImage.bind(this);
	}

	previewImage(e){
		e.preventDefault();
		
		const imgElem = e.target.parentNode.querySelector('img');
		imgElem.style.display = imgElem.style.display === 'none' ? 'block' : 'none';
	}

	displayImage(){
		console.log('displaying image!');
	}

	render(){
		const smallestImage = this.props.images[this.props.images.length - 1];

		this.handleClick = this.props.onClick;

		return (
			<div 
				id={this.props.id} 
				className="photo" 
				onChange={this.props.handleChange}
			>
				<img
					src={smallestImage.source}
					width={smallestImage.width}
					height={smallestImage.height}
					onClick={this.displayImage}
					style={{display: 'none'}}
				/>
				<label>
					{this.props.name}
					<input type="checkbox" />
				</label>
				<button className="btn btn-primary btn-xs imagePreviewButton" onClick={this.previewImage}>Preview</button>
			</div>
		);
	}

}

module.exports = Photo;