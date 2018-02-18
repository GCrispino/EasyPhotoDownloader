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
        this.handleChange = this.handleChange.bind(this);
    }

    toggleCollapse(){
        this.setState({
            collapsed: !this.state.collapsed
        });
    }

    toggleActive(){
        this.setState({active: !this.state.active});
    }

    handleChange(e){
        this.props.onAlbumChange(e,this.props.index);
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
                            checked={photo.checked}
                            handleChange={this.props.onPhotoChange}
                        />
                    )
            ),
            {active} = this.state;

        return (
            <div className="album">
                <Accordion fluid>
                    <Accordion.Title active={active} index={0} onClick={this.toggleActive}>
                        <Icon name='dropdown' />
                        {this.props.name}
                    </Accordion.Title>
                    <input
                        type="checkbox"
                        checked={this.props.checked}
                        onChange={this.handleChange}
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
