import React from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid';
const GetArtist = (artist, index, height)=>{
    return (<Row style={{width:'100%',height:height}}>
    
    <Col xs={2}>
    <svg style={{height:'100%'}}>
    <circle cx={10} cy={10} r={5/Math.sqrt(Math.log(index+2))} stroke={'hsl('+artist.hue+',100%,50%)'} stroke-width="4" fill={'hsl('+artist.hue+',100%,50%)'} />
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
    let heightItem = 40
    let maxItems = 10
    
    let styleDiv = {overflowY:  'scroll',}
    console.log(height)
    if(horizontal){
        height-=105
        while(height>(maxItems+1)*heightItem){
            maxItems++
            styleDiv.overflowY='hidden'
        }
    }
    height*=0.95
    console.log(height)
    styleDiv = {...styleDiv, maxHeight:height, height:height, overflowX:'hidden' }
    //console.log(numItems+' '+height)
    return (<Grid style={styleDiv}>
    {orderedListReal.slice(0,maxItems).map((artist, index)=>{
        return GetArtist(artist, index, heightItem)
    })}
    </Grid>)
  
}
const GeneralInfo = ({selectedHue, horizontal,prop,width, height, artistex, artistcex, orderedCandidates}) => {
    let artist = {...artistex, x:'50%', y:'20%', r:'12%', hue:117}
    
    let artistCandidates = {...artistcex, x:'50%', y:'75%', r:'12%', hue:117}
    console.log(artistCandidates.x+' '+artistCandidates.y)
    if(horizontal){
        let x = artistCandidates.x 
        artistCandidates.x = artistCandidates.y
        artistCandidates.y = x
        x = artist.x
        artist.x = artist.y
        artist.y = x
    }
    console.log(artistCandidates.x+' '+artistCandidates.y)
    let xs = (horizontal) ? 12:5
    let xs2 = (horizontal) ? 12:7
    return (
       <Grid style={{paddingLeft:'0px', paddingTop:horizontal?null:'5px'}}>
       <Row >
          <Col  xs={xs}>
            <svg style={{maxHeight:horizontal?'100px':null, width:'100%'}}>
            <line x1={artist.x} y1={artist.y} x2={artistCandidates.x} y2={artistCandidates.y} style={{stroke:'rgba(0,0,0,0.5)',strokeWidth:2 }} />
                <circle cx={artist.x} cy={artist.y} r={artist.r} stroke={'hsl('+artist.hue+',100%,50%)'} stroke-width="4" fill={'hsl('+artist.hue+',100%,50%)'} />
                <text fontSize={'60%'} text-anchor="middle" x={artist.x} y={artist.y}>
                Artist you <br/>listen to
                </text>
                <circle cx={artistCandidates.x} cy={artistCandidates.y} r={artistCandidates.r} stroke={'hsl('+artistCandidates.hue+',100%,50%)'} stroke-width="4" fill={'rgba(0,0,0,0)'}/>
                <text fontSize={'60%'} text-anchor="middle" x={artistCandidates.x} y={artistCandidates.y}>
                Related artist
                </text>
            </svg>
          </Col>
          <Col xs={xs2} >
          {GetAllArtists(orderedCandidates, height,horizontal, selectedHue)}
          </Col>
        </Row>
       </Grid>
    )
    
};
export default GeneralInfo;