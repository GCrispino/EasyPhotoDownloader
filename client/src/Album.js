const React = require('react');

class Album extends React.Component{
    constructor(){
        super();
    }

    handlePhotoChange(e){
        let selectedPhotos = this.state.selectedPhotos;
        selectedPhotos[e.target.key] = e.target.selected;

        this.setState({selectedPhotos});
    }

    render(){
        const photos = 
            this.props.photos.map(
                photo => 
                    (
                        <option>
                            <Photo 
                                image={photo.images[0]}
                                onChange={this.props.handleChange}
                            />
                        </option>
                    )
            );

        return <select>{photos}</select>;
    }
}

module.exports = Album;