import React,{Component} from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid';
import SvgInfo from './SvgInfo'
const GetArtist = (artist, index, height, maxItems)=>{
    return (<Row style={{width:'100%',height:height}}>
    
    <Col xs={2}>
    <svg style={{height:'100%'}}>
    <circle cx={10} cy={10} r={9/((index+1)**(1/3))} stroke={'hsl('+artist.hue+',100%,50%)'} stroke-width="2" fill={'hsla('+artist.hue+',100%,50%,0)'} />
    </svg>
    </Col>
    <Col xs={2}>
    #{index+1}
    </Col>
    <Col xs={6}>
    {artist.name}
    </Col>
    </Row>)
}
const GetAllArtists = (orderedList, height, horizontal, selectedHue)=>{
    let orderedListReal = selectedHue ? orderedList.filter((a)=>{ return a.hue==selectedHue}):orderedList
    let heightItem = 50
    let maxItems = 10
    
    let styleDiv = {overflowY:  'scroll',}
    if(horizontal){
        height-=105
        while(height-40>(maxItems+1)*heightItem){
            maxItems++
            styleDiv.overflowY='hidden'
        }
    }
    height*=0.95
    styleDiv = {...styleDiv, maxHeight:height, height:height, overflowX:'hidden' }
    //console.log(numItems+' '+height)
    return (<Grid style={styleDiv}>
    <Row style={{width:'100%',height:40, fontWeight:'bolder', textAlign:'center'}}>
    <div style={{textAlign:'center', width:'100%'}}>
    Suggested artists
    </div>
    </Row>
    {orderedListReal.slice(0,maxItems).map((artist, index)=>{
        return GetArtist(artist, index, heightItem, maxItems)
    })}
    </Grid>)
  
}
class GeneralInfo extends Component {
    constructor(){
        super();
        this.state = {
            page:0
        }
    }
    render() {
    let {selectedHue, horizontal,prop,width, height, artistex, artistcex, orderedCandidates} = this.props
    let xs = (horizontal) ? 12:4
    let xs2 = (horizontal) ? 12:7
    return (
       <Grid style={{paddingLeft:horizontal?'7px':'0px', paddingTop:horizontal?'10px':'5px'}}>
       
       <Row >
          <Col  xs={xs} style={{ cursor: 'pointer',userSelect: 'none'}} onClick={()=>{this.setState((prevState)=>{
              return {page:(prevState.page+1)%3}})}}>
            <div style={{height:!horizontal?'20px':null, fontWeight:'bolder'}}>Tips ({this.state.page+1}/3)</div>
            <SvgInfo page={this.state.page} horizontal={horizontal} style={{maxHeight:horizontal?'80px':height*0.9, width:'100%'}} />                
          </Col>
          <Col xs={xs2} >
          {GetAllArtists(orderedCandidates, height,horizontal, selectedHue)}
          </Col>
        </Row>
       </Grid>
    )
    
    }
}
export default GeneralInfo;