import React from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid';
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
        return GetArtist(artist, index, heightItem, maxItems)
    })}
    </Grid>)
  
}
const GeneralInfo = ({selectedHue, horizontal,prop,width, height, artistex, artistcex, orderedCandidates}) => {
    let artist = {...artistex, x:50, y:20, r:7, hue:117}
    
    let artistCandidates = {...artistcex, x:50, y:75, r:7, hue:117}
    if(horizontal){
        let x = artistCandidates.x 
        artistCandidates.x = artistCandidates.y
        artistCandidates.y = x
        x = artist.x
        artist.x = artist.y
        artist.y = x
    }
    let xs = (horizontal) ? 12:5
    let xs2 = (horizontal) ? 12:7
    let textCy = (horizontal) ? 15 : artistCandidates.y
    let texty =(horizontal) ? 15 : artist.y

    return (
       <Grid style={{paddingLeft:horizontal?'7px':'0px', paddingTop:horizontal?'10px':'5px'}}>
       <Row >
          <Col  xs={xs}>
            <svg style={{maxHeight:horizontal?'100px':height, width:'100%'}}>
            <line x1={artist.x+'%'} y1={artist.y+'%'} x2={artistCandidates.x+'%'} y2={artistCandidates.y+'%'} style={{stroke:'rgba(0,0,0,0.5)',strokeWidth:2 }} />
                <circle cx={artist.x+'%'} cy={artist.y+'%'} r={artist.r+'%'} stroke={'#4DB83D'} stroke-width="4" fill={'#4DB83D'} />
                <text fontWeight={'bolder'} fontSize={'60%'} text-anchor="middle" x={artist.x+'%'} y={texty+'%'}>
                Artist you <br/>listen to
                </text>
                <circle cx={artistCandidates.x+'%'} cy={artistCandidates.y+'%'} r={artistCandidates.r+'%'} stroke={'#4DB83D'} stroke-width="4" fill={'rgba(0,0,0,0)'}/>
                <text fontWeight={'bolder'} fontSize={'60%'} text-anchor="middle" x={artistCandidates.x+'%'} y={textCy+'%'}>
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