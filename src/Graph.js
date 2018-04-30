
import React,{Component}from 'react';
import Artist from './Artist'
import {InteractiveForceGraph, ForceGraphNode, ForceGraphLink} from 'react-vis-force';
import _ from 'lodash';


const GetImportance = (range)=>{
    let returnval = 0
    switch(range){
      case 'short_term':
        returnval = 1
        break;
      case 'medium_term':
        returnval = 3
        break;
      case 'long_term':
        returnval = 4
        break;
    }
    return returnval
  }

class Graph2 extends Component {
    constructor(props){
        super(props)
        this.state = {
            
        }
        this.graphRef = React.createRef();
    }    
    static getDerivedStateFromProps(nextProps, prevState){
        let newState = {...prevState}
        newState.candidatesSelected = Object.keys(nextProps.artistsCandidates).reduce((result, item)=>{
            if(nextProps.artistsCandidates[item].connections.length > 1) result.push(item)            
            return result
        },[])
        return newState
    }
    getEdge(id1, id2){
        return <ForceGraphLink key={id1+'to'+id2} link={{ source: id1, target: id2 }} />
    }
    getNode(id, artist,color){
        return <ForceGraphNode key={id} r={3} node={{ id: id, label: artist['name'] }} fill={color} showLabel/>
    }
    getEdges(){
        let me = this
        //let allNodes
        
        return _.flatMap(me.state.candidatesSelected,(item,index)=>{
            let edges = me.props.artistsCandidates[item].connections.map((item2,index,array)=>{
                return me.getEdge(item,item2)
            })
            return edges    
        })
    }
    getNodes(){
        let me = this
        if (_.isEmpty(me.props.artists)) return null
        let artists = me.props.artists
        let principal = _.reduce(Object.keys(me.props.artists),(result, item)=>{   
            result.push(me.getNode(item,me.props.artists[item], "red"))   
            return result
        },[])
        let candidates = _.reduce(me.state.candidatesSelected,(result, item)=>{   
            result.push(me.getNode(item, me.props.artistsCandidates[item], "blue"))    
            return result
        },[])
        return principal.concat(candidates)
    }
    getGraph(nodes, edges){
      let me = this
      
      let stuffinside = nodes

      if (!stuffinside) return null
      if (edges) stuffinside = stuffinside.concat(edges)
      if (stuffinside.length == 0) return null      
      return (<InteractiveForceGraph 
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
      {stuffinside}
      </InteractiveForceGraph>)
    }
    componentDidUpdate(prevProps, prevState, snapshot){
        
    }
    render(){
      let me = this
      let nodes = me.props.createGraph?me.getNodes():null
      let edges = me.props.createGraph?me.getEdges():null
      let graph = me.props.createGraph?me.getGraph(nodes, edges):null     
      return(
          <div>
          {graph}
          </div>
      )
    }
}
    
   

export default Graph2;