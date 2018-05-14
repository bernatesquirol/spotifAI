import React,{Component} from 'react';
import { Grid, Row, Col } from 'react-flexbox-grid';

const GetArtist1 = (page)=>{
    switch(page){
        case 0:
            return { x:50, y:20, r:7, stroke: '#4DB83D', fill:'#4DB83D', text:'Artist you listen to'}
            
        case 1:
            return  { x:50, y:20, r:7, stroke: 'hsl(112, 50%, 48%)', fill:'hsl(112, 50%, 48%)',text:'+ important'}
            
        case 2:
            return  { x:50, y:20, r:7, stroke: 'hsl(112, 50%, 48%)', fill:'hsl(112, 50%, 48%)',text:'+ recent'}
        default:
            return {}
    }

}
const GetArtist2 = (page)=>{
    switch(page){
        case 0:
            return { x:50, y:75, r:7, stroke: '#4DB83D', fill:'rgb(0,0,0,0)', text:'Related artist'}
            break;
        case 1:
            return  { x:50, y:75, r:2, stroke: 'hsl(112, 50%, 65%)', fill:'hsl(112, 50%, 65%)',text:'- important'}
            break;
        case 2:
            return  { x:50, y:75, r:7, stroke: 'hsl(112, 50%, 35%)', fill:'hsl(112, 50%, 35%)',text:'- recent'}
        default:
            return {}
    }

}
const GetLink = (page)=>{
    return page==0
}
class SvgInfo extends Component {
    constructor(){
        super();
    }
    
    render() {
        let horizontal = this.props.horizontal
        let style = this.props.style
        let page = this.props.page
        let artist1 = GetArtist1(page)
        let artist2 = GetArtist2(page)
        let line = GetLink(page)
        if(horizontal){
            let x = artist1.x 
            artist1.x = artist1.y
            artist1.y = x
            x = artist2.x
            artist2.x = artist2.y
            artist2.y = x
        }    
        let textCy = (horizontal) ? 15 : artist2.y
        let texty =(horizontal) ? 15 : artist1.y
        return (
    <svg style={style}>
        {line?<line x1={artist1.x+'%'} y1={artist1.y+'%'} x2={artist2.x+'%'} y2={artist2.y+'%'} style={{stroke:'rgba(0,0,0,0.5)',strokeWidth:2 }} />:null}
        <circle cx={artist1.x+'%'} cy={artist1.y+'%'} r={artist1.r+'%'} stroke={artist1.stroke} stroke-width="4" fill={artist1.fill} />
        <text fontWeight={'bolder'} fontSize={'60%'} textAnchor="middle" x={artist1.x+'%'} y={texty+'%'}>
        {artist1.text}
        </text>
        <circle cx={artist2.x+'%'} cy={artist2.y+'%'} r={artist2.r+'%'} stroke={artist2.stroke} strokeWidth="4" fill={artist2.fill}/>
        <text fontWeight={'bolder'} fontSize={'60%'} textAnchor="middle" x={artist2.x+'%'} y={textCy+'%'}>
        {artist2.text}
        </text>
    </svg>)
    }
}
export default SvgInfo;