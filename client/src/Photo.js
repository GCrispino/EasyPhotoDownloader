const React = require('react');

//CHANGE IMAGE PREVIEW SIZE 
class Photo extends React.Component{
	constructor(props){
		super(props);

		this.displayImage = this.displayImage.bind(this);
	}

	previewImage(e){
		e.preventDefault();
		
		// const imgElem = e.target.parentNode.querySelector('img');
		// imgElem.style.display = imgElem.style.display === 'none' ? 'block' : 'none';
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
				
				<label>
					{this.props.name}
					<input type="checkbox" />
				</label>
				<button className="btn btn-primary btn-xs imagePreviewButton" data-toggle="modal" data-target={'#photoModal' + this.props.id} onClick={this.previewImage}>Preview</button>
				<div id={'photoModal' + this.props.id} className="modal fade" role="dialog">
					<div className="modal-dialog">

						<div className="modal-content">
							<div className="modal-header">
								<button type="button" className="close" data-dismiss="modal">&times;</button>
								<h4 className="modal-title">{this.props.name}</h4>
							</div>
							<div className="modal-body">
								<img
									className="center-block"
									src={smallestImage.source}
									alt={this.props.name}
									width={smallestImage.width}
									height={smallestImage.height}
									onClick={this.displayImage}
								/>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
							</div>
						</div>

					</div>
				</div>
			</div>
		);
	}

}

module.exports = Photo;