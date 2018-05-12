
import React from 'react';
import GeneralInfo from './GeneralInfo'
const Details = ({prop,width, height, selected,selectedHue, artistex, artistcex, orderedCandidates}) => {
    let styleDiv = {}
    let styleDivInside = {}
    let horizontal = false
    if (width/height>1) { 
        styleDiv.width = (1-prop)*width
        styleDiv.height = height
        styleDiv.float = 'right'
        styleDivInside.height = 0.95*height
        styleDivInside.width = '95%'        
        styleDivInside.marginTop = 0.025*height
        horizontal=true
    }else{
        styleDiv.width = '100%'
        styleDiv.height = (1-prop)*height*0.92
        styleDiv.position = 'fixed'
        styleDivInside.width = '94%'
        styleDivInside.marginLeft = '3%'
        styleDivInside.height =styleDiv.height
    }

    return (<div style={{...styleDiv, textAlign:'center'}}>
        <div style={{borderRadius:'25px',backgroundColor:'white', width:'100%',height:'100%', ...styleDivInside}}>
        {!selected?
        <GeneralInfo selectedHue={selectedHue} horizontal={horizontal} orderedCandidates={orderedCandidates} width={width} height={styleDivInside.height} artistex={artistex} artistcex={artistcex}/>:
        null}
        </div>
    </div>)
    
};

export default Details;