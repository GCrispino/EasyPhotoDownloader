const React = require('react');
const Photo = require('./Photo');

class Album extends React.Component{
    constructor(props){
        super(props);

    }

    render(){
        const photos = 
            this.props.photos.map(
                (photo,i) => 
                    (
                        <Photo
                            key={i}
                            id={`photo${this.props.index}-${i}`} 
                            name={photo.name}
                            images={photo.images}
                            onChange={this.props.onPhotoChange} 
                        />
                    )
                    // (
                    //     <option>
                    //         <Photo 
                    //             image={photo.images[0]}
                    //             onChange={this.props.handleChange}
                    //         />
                    //     </option>
                    // )
            );

        return (
            <div className="album">
                <label>
                    {this.props.name}
                    <input 
                        type="checkbox" 
                        onChange={this.props.onAlbumChange} 
                        id={'album' + this.props.index} 
                    />
                </label>
                <div className="photoContainer">{photos}</div>
            </div>
        );
    }
}

module.exports = Album;