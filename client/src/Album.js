const React = require('react');
const Photo = require('./Photo');
const { Accordion,Icon } = require('semantic-ui-react');

class Album extends React.Component{
    constructor(props){
        super(props);

        this.state = {
            collapsed: false,
            active: false
        };

        this.toggleCollapse = this.toggleCollapse.bind(this);
        this.toggleActive = this.toggleActive.bind(this);
    }

    toggleCollapse(){
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    toggleActive(){
        this.setState({active: !this.state.active});
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
            ),
            {active} = this.state;

        return (
            <div className="album">
                {/* <a href={`#photoContainer${this.props.index}`} onClick={this.toggleCollapse} data-toggle="collapse">
                     {
					 	this.state.collapsed ? 
							 <FontAwesomeIcon icon={faArrowDown}/> 
							: <FontAwesomeIcon icon={faArrowRight}/>
					}
                </a>
                <label className="albumLabel" >
                    {this.props.name}
                    <input 
                        type="checkbox" 
                        onChange={this.props.onAlbumChange} 
                        id={'album' + this.props.index} 
                    />
                </label>
                <div className="collapse photoContainer" id={`photoContainer${this.props.index}`}>{photos}</div> */}


                <Accordion fluid>
                    <Accordion.Title active={active} index={0} onClick={this.toggleActive}>
                        <Icon name='dropdown' />
                        {this.props.name}
                    </Accordion.Title>
                    <input
                        type="checkbox"
                        onChange={this.props.onAlbumChange}
                        id={'album' + this.props.index}
                    />
                    <Accordion.Content active={active}>
                        <div className="collapse photoContainer" id={`photoContainer${this.props.index}`}>{photos}</div>
                    </Accordion.Content>

                   
                </Accordion>
            </div>
        );
    }
}

module.exports = Album;
