const React = require('react');

class Album extends React.Component{
    constructor(props){
        super(props);

    }

    render(){
        const photos = 
            this.props.photos.map(
                (photo,i) => 
                    (
                        <div 
                            key={i}
                            id={`photo${this.props.index}-${i}`} 
                            className="photo" 
                            onChange={this.props.onPhotoChange.bind(this)} 
                        >
                            <label>
                                {photo.name}
                                <input type="checkbox" />
                            </label>
                        </div>
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