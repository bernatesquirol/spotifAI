
import React,{Component}from 'react';
import Artist from './Artist'
import { Layer,Stage, Container, Rect, Text } from "react-konva";
const GetRandomPointsR2=(n, width, height)=>{
    let allpoints=[]
    for(let i=0;i<n;i++){
        let point = [Math.random() * width,Math.random() * height]
        allpoints.push(point)
    }
    return allpoints
}
class Graph extends Component {
    constructor(props){
        super(props)
        this.state = {
            readyToDraw:false,
            artists:{}
        }
    }
    static getDerivedStateFromProps(nextProps, prevState){
        let newState = {...prevState}
        if(nextProps.createGraph){
            console.log('ready')
            newState.artists = {}
            let randomPoints = GetRandomPointsR2(Object.keys(nextProps.data).length,nextProps.width, nextProps.height)
            Object.keys(nextProps.data).forEach((item,index,array)=>{
                let neighbours = nextProps.data[item].neighbours
                newState.artists[item] = {
                    'id':item,
                    'name':nextProps.data[item].name,
                    'neighbours':neighbours,
                    'x':randomPoints[index][0],
                    'y':randomPoints[index][1],
                    'net_forcex':0,
                    'net_forcey':0,
                    'velocityy':0,
                    'velocityx':0
                }
            })
            //this.interval = setInterval(computePositionsNodes, 1000);
        }     
        newState.readyToDraw = true   
        return newState
    }
    componentWillUnmount() {
        clearInterval(this.interval);
    }
    componentDidMount() {
        this.interval = setInterval(()=>{this.computePositionsNodes()}, 5000);
    }
    computePositionsNodes(){
        let me = this
        console.log('changing')
        if(me.props.createGraph && me.state.readyToDraw){
            console.log('real changing')
            me.setState((prevState)=>{
                let newartists = {...prevState.artists}
                Object.keys(newartists).forEach((idx,index,array)=>{
                    let artistx = {...newartists[idx]}
                    Object.values(newartists).forEach((artisty,index,array)=>{
                        if(artistx.id!=artisty.id){
                            // squared distance between "u" and "v" in 2D space
                            let rsq = ((artistx.x-artisty.x)*(artistx.x-artisty.x)+(artistx.y-artisty.y)*(artistx.y-artisty.y));
                            // counting the repulsion between two vertices 
                            if(rsq!=0){
                                artistx.net_forcex += 200 * (artistx.x-artisty.x) /rsq;
                                artistx.net_forcey += 200 * (artistx.y-artisty.y) /rsq;
                            }
                            
                        }               
                    })
                    artistx.neighbours.forEach((neighbour)=>{
                        let artisty = newartists[Object.keys(neighbour)[0]]
                        // countin the attraction
                        artistx.net_forcex += 0.06*(artisty.x - artistx.x);
                        artistx.net_forcey += 0.06*(artisty.y - artistx.y);
                    })
                    // counting the velocity (with damping 0.85)
                    artistx.velocityx = (artistx.velocityx + artistx.net_forcex)*0.85; 
                    artistx.velocityy = (artistx.velocityy + artistx.net_forcey)*0.85; 
                    artistx.x += artistx.velocityx;
                    artistx.y += artistx.velocityy;
                    newartists[idx] = artistx
                })
                return {
                    artists:newartists
                }
            })
        }
        /*for(i=0; i < n; i++) // set new positions
        {
            v = vertices[i];
            if(v.isDragged){ v.x = mouseX; v.y = mouseY; }
            else { v.x += v.velocity.x; v.y += v.velocity.y; }
        }
        // drawing edges
        graphics.clear();
        graphics.lineStyle(3, 0x333333);
        for(i=0; i < n; i++)
        {
            for(j=0; j < n; j++)
            {
                if(!edges[i][j]) continue;
                graphics.moveTo(vertices[i].x, vertices[i].y);
                graphics.lineTo(vertices[j].x, vertices[j].y);
            }
        }*/
    }

    render(){
        let me = this
        return(<Stage width={window.innerWidth} height={window.innerHeight}>
            <Layer>
            {
            me.state.artists?Object.values(me.state.artists).map((artist,index)=>{
                let id = Object.keys(me.state.artists)[index]
                return <Artist key={id} x={artist.x} y={artist.y} name={artist.name}/>
            }):null
            }
            </Layer>
        </Stage>
        )
    }
}
    
   

export default Graph;