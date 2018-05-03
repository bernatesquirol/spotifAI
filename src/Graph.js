
import React,{Component}from 'react';
import Artist from './Artist'
import {InteractiveForceGraph, ForceGraphNode, ForceGraphLink} from 'react-vis-force';
import _ from 'lodash';
const AddConnectionsToGraph = (graph,id, conn)=>{
    conn.forEach((key)=>{
        if(!graph[key]) graph[key]=[]
        if(!graph[id]) graph[id]=[]
        graph[key].push(id)
        graph[id].push(key)
    })
}
const Normalize = (dictionary, field)=>{
    let max = 0
    let min = 10000000
    Object.values(dictionary).forEach((item)=>{
        if (item[field]>max) max = item[field]
        if (item[field]<min) min = item[field]
    })
    return Object.keys(dictionary).map((key)=>{
        let item = dictionary[key]
        item[field] = (item[field]-min)/(max-min)
        return item
    })
}
const GetRadius=(artist)=>{
    return 10
}
const GetLight=(artist)=>{
    if (artist.freshness) return artist.freshness*50+25
    else return 50
}
const GetFill = (artist)=>{
    return 'hsl('+artist.hue+',100%,'+GetLight(artist)+'%)'
}
const GetBorder = (artist)=>{
    
}
const GetImportanceCandidate = (graph,id)=>{
    return graph[id].length
}
const GetImportance = (artist)=>{    
    let returnval = 0
    Object.keys(artist.tops).forEach((item)=>{
        let value = artist.tops[item]+1
        let multiplier = 0
        switch(item){
            case 'short_term':
                multiplier = 1
                break;
            case 'medium_term':
                multiplier = 2
                break;
            case 'long_term':
                multiplier = 3
                break;
        }
        returnval+=multiplier/value
    })
    return returnval
}
const GetFreshness = (artist)=>{    
    let returnval = 0
    Object.keys(artist.tops).forEach((item)=>{
        let multiplier = 0
        switch(item){
            case 'short_term':
                multiplier = 3
                break;
            case 'medium_term':
                multiplier = 2
                break;
            case 'long_term':
                multiplier = 1
                break;
        }
        returnval+=multiplier
    })
    return returnval/artist.tops
}
const GetColoredArtists= (graph, artists)=>{
    let newArtists = {...artists}
    //return artists
    let clusters = []
    let notvisited = Object.keys(artists)
    while (notvisited.length!=0){
        let idSelected = notvisited[Math.floor(Math.random()*notvisited.length)]
        let cluster = []
        let clusterElementsToVisit = [idSelected]        
        while(clusterElementsToVisit.length!=0){
            let node = clusterElementsToVisit.pop()
            cluster.push(node)
            notvisited.splice(notvisited.indexOf(node),1)
            clusterElementsToVisit.splice(clusterElementsToVisit.indexOf(node),1)
            if (graph[node]){
                graph[node].forEach((key)=>{
                    if (cluster.indexOf(key)<0)clusterElementsToVisit.push(key)
                })
            }
            
        }
        clusters.push(cluster)
    }
    let numPartition = 340/clusters.length
    let randomStart = Math.random()*340
    clusters.forEach((list,index,array)=>{
        let hue = ((index+1)*numPartition+randomStart)%340
        list.forEach((key)=>{
            newArtists[key].hue=hue
        })
    })
    
    return newArtists
}

class Graph2 extends Component {
    constructor(props){
        super(props)
        this.state = {
            artists:[],
            candidatesSelected:[],
            minConn:0,
            maxConn:0,

        }
        this.graphRef = React.createRef();
    }    
    static getDerivedStateFromProps(nextProps, prevState){
        let newState = {...prevState}
        let maxConn = 0
        let minConn = 100
        let candidatesSelected = Object.keys(nextProps.artistsCandidates).reduce((result, item)=>{
            let numconn = nextProps.artistsCandidates[item].connections.length
            if(numconn>maxConn) maxConn=numconn
            if(numconn<minConn) minConn=numconn
            if(numconn > 1) result.push(item)
            return result
        },[])
        //create graph
        let graph = {}
        Object.keys(nextProps.artists).forEach((item)=>{
            let artist = nextProps.artists[item]
            AddConnectionsToGraph(graph,item,artist.connections)
        })        
        candidatesSelected.forEach((item)=>{
            let artist = nextProps.artistsCandidates[item]
            AddConnectionsToGraph(graph,item,artist.connections)
        })
        //if(nextProps.drawGraph){
        let artists = {}
        //importance
        Object.keys(nextProps.artists).forEach((item)=>{
            let artist = nextProps.artists[item]
            artist.importance = GetImportance(artist)
            artist.freshness = GetFreshness(artist)
            //artist.hue = GetRandomHue(artist)
            artists[item]=artist
        })
        Normalize(artists,'freshness')
        Normalize(artists,'importance')
        
        candidatesSelected.forEach((item)=>{
            let artist = nextProps.artistsCandidates[item]
            artist.importance = GetImportanceCandidate(graph, item)
            artists[item]=artist
        })
        Normalize(artists,'importance')
        
        artists = GetColoredArtists(graph, artists)
        //newState.graph = graph
        newState.artists=artists
        //newState.artistsCandidates=artistsCandidates
        
        
        return newState
    }
    getEdge(id1, id2){
        return <ForceGraphLink key={id1+'to'+id2} link={{ source: id1, target: id2 }} />
    }
    
    getNode(id, artist, color, radius){
        //stroke={getColor(artist)}
        let me = this
        return <ForceGraphNode 
                key={id} 
                r={GetRadius(artist)} 
                node={{ id: id, label: artist['name'] }} 
                fill={GetFill(artist)} strokeWidth="1"   
                stroke="black"
                showLabel
                labelStyle={{userSelect: 'none'}}
                />
    }
    getEdges(){
        let me = this
        //let allNodes
        
        return _.flatMap(Object.keys(me.state.artists),(item,index)=>{
            let edges = me.state.artists[item].connections.map((item2,index,array)=>{
                return me.getEdge(item,item2)
            })
            return edges    
        })
    }
    getNodes(){
        let me = this
        if (_.isEmpty(me.state.artists)) return null
        let artists = me.state.artists
        let principal = _.reduce(Object.keys(artists),(result, item)=>{   
            result.push(me.getNode(item, artists[item], "red"))   
            return result
        },[])
        /*let candidates = _.reduce(me.state.candidatesSelected,(result, item)=>{   
            result.push(me.getNode(item, me.props.artistsCandidates[item], "blue"))    
            return result
        },[])*/
        return principal
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
      simulationOptions={{ height: me.props.height, width: me.props.width,  animate:true }}
      onSelectNode={(event,node) => {
          console.log(node['label'])
          //console.log(event)
      }}                
      >
      {stuffinside}
      </InteractiveForceGraph>)
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