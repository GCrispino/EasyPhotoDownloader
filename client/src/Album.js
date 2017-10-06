const React = require('react');
const Photo = require('./Photo');

class Album extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            collapsed: false
        };

        this.toggleCollapse = this.toggleCollapse.bind(this);
    }

    toggleCollapse(){
        this.setState({
            collapsed: !this.state.collapsed
        });
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
                            handleChange={this.props.onPhotoChange} 
                        />
                    )
            );

        return (
            <div className="album">
                <a href={`#photoContainer${this.props.index}`} onClick={this.toggleCollapse} data-toggle="collapse">
                     {this.state.collapsed ? 'Hide' : 'Show'}
                </a>
                <label className="albumLabel" >
                    {this.props.name}
                    <input 
                        type="checkbox" 
                        onChange={this.props.onAlbumChange} 
                        id={'album' + this.props.index} 
                    />
                </label>
                <div className="collapse photoContainer" id={`photoContainer${this.props.index}`}>{photos}</div>
            </div>
        );
    }
}

module.exports = Album;