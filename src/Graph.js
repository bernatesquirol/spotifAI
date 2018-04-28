
import React,{Component}from 'react';
import Artist from './Artist'
import {InteractiveForceGraph, ForceGraphNode, ForceGraphLink} from 'react-vis-force';
import _ from 'lodash';
const GetRandomPointsR2=(n, width, height)=>{
    let allpoints=[]
    for(let i=0;i<n;i++){
        let point = [Math.random() * width,Math.random() * height]
        allpoints.push(point)
    }
    return allpoints
}

class Graph2 extends Component {
    constructor(props){
        super(props)
        this.state = {
            readyToDraw:false
        }
        this.graphRef = React.createRef();
    }    
    static getDerivedStateFromProps(nextProps, prevState){
        let newState = {...prevState}
        newState.readyToDraw =nextProps.readyToDraw
        return newState
    }
    getEdges(){
        let me = this
        return _.flatMap(Object.keys(me.props.data),(item,index)=>{
            let edges = me.props.data[item].neighbours.map((item2,index,array)=>{
                let key2=Object.keys(item2)[0]
                return <ForceGraphLink strokeWidth={item2[key2]} key={item+'to'+key2} link={{ source: item, target: key2 }} />
            })
            return edges    
        })
    }
    getNodes(){
        let me = this
        return _.map(Object.keys(me.props.data),(item,index)=>
        {
            //let node = _.pick(me.props.data[item],['name'])
            return <ForceGraphNode key={item} r={me.props.data[item]['importance']} node={{ id: item, label: me.props.data[item]['name'] }} fill="red" showLabel/>
        }
        )
    }
    componentDidUpdate(prevProps, prevState, snapshot){
        if(prevState.readyToDraw ){
            console.log("yeah")
            
        }
    }
    render(){
        let me = this
        const nodes = me.state.readyToDraw ? me.getNodes() : null
        const edges = me.state.readyToDraw ? me.getEdges() : null
        const graph = me.state.readyToDraw ? (
            <InteractiveForceGraph 
                ref={this.graphRef}
                labelAttr="label"
                highlightDependencies={true}
                zoom 
                zoomOptions={{scale:10}}
                simulationOptions={{ height: me.props.height, width: me.props.width, animate:true }}
                onSelectNode={(event,node) => {
                    console.log(node['label'])
                    //console.log(event)
                }}
                
            >
            {nodes}
            {edges}
            </InteractiveForceGraph>
          ) : (
            null
          );
        /*if(this.graphRef.current){
            console.log(this.graphRef.current)
        }*/
          
        //this.graphRef.zoomTo(0,0,3)
        return(
            <div>{graph}
            </div>
        )
    }
}
    
   

export default Graph2;