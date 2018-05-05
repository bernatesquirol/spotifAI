import React,{Component}from 'react';

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
    return returnval/Object.keys(artist.tops).length
}

const GetColoredArtists= (graph, artists)=>{
    let newArtists = {...artists}
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
    let numPartition = 60/clusters.length
    let randomStart = Math.random()*60
    
    clusters.forEach((list,index,array)=>{
        let hue =(334+Math.random()*60)%360//(index+1)*numPartition+randomStart
        list.forEach((key)=>{
            newArtists[key].radius = 5+newArtists[key].importance*5
            newArtists[key].hue=hue
            newArtists[key].light=0.5//newArtists[key].freshness?newArtists[key].freshness:0.5
        })
    })
    
    return newArtists
}

const d3 = window.d3

const onlyUnique = (value, index, self) => { 
    return self.indexOf(value) === index;
}
const GetScalated = (prob, min, max)=>{
    return prob*(max-min) + min
}
const GetDistance=(artist1, artist2)=>{
    let genres1 = _.flatMap(artist1.genres,(item)=>{
        return item.split(" ")
    }).filter( onlyUnique );
    let genres2 = _.flatMap(artist2.genres,(item)=>{
        return item.split(" ")
    }).filter( onlyUnique );
    let intersectSize = _.intersection(genres1, genres2).length
    return intersectSize>0?Math.min(genres1.length,genres2.length)/intersectSize:2;
}
//https://codepen.io/trey-davis/pen/WOoXyQ?editors=0110
class Graph2 extends Component {
    constructor(props){
        super(props)
        this.state = {
            readyToDraw:false
        }
        
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
        let artistsDic = {}
        //importance
        Object.keys(nextProps.artists).forEach((item)=>{
            let artist = nextProps.artists[item]
            artist.importance = GetImportance(artist)
            artist.freshness = GetFreshness(artist)
            //artist.hue = GetRandomHue(artist)            
            artist.id = item            
            artistsDic[artist.id] = artist
        })
        Normalize(artistsDic,'freshness')
        ////Normalize(artists,'importance')
        
        candidatesSelected.forEach((item)=>{
            let artist = nextProps.artistsCandidates[item]
            artist.importance = GetImportanceCandidate(graph, item)
            artist.id = item
            //newartist.connections = artist.connections
            artistsDic[artist.id] = artist
        })
        Normalize(artistsDic,'importance')
        
        artistsDic = GetColoredArtists(graph, artistsDic)
        let artists = Object.values(artistsDic)
        newState.artistsDic
        newState.nodes=artists
        newState.links= _.flatMap(artists,(item,index)=>{
            let key = item.id
            let edges = item.connections.map((item2,index,array)=>{
                return {"source": key, "target": item2, "value": 1}
            })
            return edges    
        })
        //this.DrawGraph(newState.nodes,newState.links)
        
        return newState
    }
    componentDidUpdate(){
        let me = this
        
    }
    DrawGraph(){
        let me = this
        let nodes = me.state.nodes
        let links = me.state.links
        let svg = d3.select("svg")
        let width = +svg.attr("width")
        let height = +svg.attr("height")

        
        let distanceLinks = 25
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance((d)=>{
                let returnval = distanceLinks+10*GetDistance(d.source,d.target)
                return distanceLinks}).strength(1.1).id(function(d) { return d.id; }))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("r", d3.forceRadial(100))
            
        if(width<500 && height/width>1.7){
            //simulation.force("forceX", d3.forceX().strength(.1).x(width * .5))
        }
            //.force("forceY", d3.forceY().strength(.1).y(height * .5))
            
        let g1 = svg.append("g");
        let g2 = svg.append("g");
        let link = g1.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

        let drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
        let node = g2
            .attr("class", "nodes")
            .selectAll("nodes")
            .data(nodes)
            .enter().append("g")
            .call(drag);
        let circle = node.append("circle")
            .attr("r",(d)=>{return d.radius})
            .attr("fill", function(d) { 
                let alpha = d.order==0?1:0
                return  "hsla("+d.hue+",100%,45%,"+alpha+")"})
            .attr("stroke",(d)=>{
                let alpha = d.order==0?0:1
                return  "hsla("+d.hue+",100%,45%,"+alpha+")"
            })
            .attr("stroke-width",2)
            .on('mousedown.fade', fade(0.1))        
            .on('mouseout.fade', fade(1))
            
        let text = node.append("text")
                //.append('tspan')
                .attr('text-anchor', 'middle')
                .attr('class','textnode')
                .attr("fill",'white')
                .text((d)=>{return d.name})
                .attr("font-size",(d)=>{return d.radius*2/3})
                .on('mousedown.fade', fade(0.1))        
                .on('mouseout.fade', fade(1))

        simulation.on("tick", ticked);
        simulation
            .nodes(nodes)
            

        simulation.force("link")
            .links(links);
        function ticked() {
            console.log("ticked")
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            circle
                .attr("cx", function(d) { return d.x=Math.max(d.radius, Math.min(width - d.radius, d.x)); })
                .attr("cy", function(d) { return d.y=Math.max(d.radius, Math.min(height - d.radius, d.y)); });
            text
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        }
        let zoom = d3.zoom()
        .scaleExtent([1 / 2, 8])
        .on("zoom", zoomed)

        svg.call(zoom)
        .call(zoom.transform, d3.zoomIdentity.translate(-500, -500).scale(2))
        
        

        function zoomed() {
            g1.attr("transform", d3.event.transform);
            g2.attr("transform", d3.event.transform);
        }

        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d3.select(this).raise().classed("active", true);
            //d3.event.sourceEvent.stopPropagation();
            //d3.select(this).classed("dragging", true);
          }
          
        function dragged(d) {
            d.fx = Math.max(d.radius, Math.min(width - d.radius, d3.event.x));
            d.fy =  Math.max(d.radius, Math.min(width - d.radius, d3.event.y));
            /*d3.select(this).select("text")
                .attr("x", d.x = d3.event.x)
                .attr("y", d.y = d3.event.y);
            d3.select(this).select("circle")
                .attr("cx", d.x = d3.event.x)
                .attr("cy", d.y = d3.event.y);
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });*/
        }
        
        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d3.select(this).classed("active", false);
            
        }
        const linkedByIndex = {};
        links.forEach(d => {
            linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
        });
        function isConnected(a, b) {
            return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
        }
        function fade(opacity) {
            return d => {
            circle.style('stroke-opacity', function (o) {
                const thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });

            link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : opacity));
            text.style('opacity',function (o) {
                const thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
                return thisOpacity;
            });
            };
        }
   
   
      }
    render(){
        let me = this
        if(me.props.createGraph){
            if(!me.state.readyToDraw)me.setState({readyToDraw:true})
            else me.DrawGraph()
        }
        return(
            me.props.createGraph?<svg width={me.props.width} height={me.props.height}></svg>:
            <div className="title" style={{marginTop:me.props.height/2-100}}>Loading { Math.round((1-me.props.loading)*100)}%</div>
        )
    }
}
    
   

export default Graph2;