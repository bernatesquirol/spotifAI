import React,{Component}from 'react';

import _ from 'lodash';
import Details from './Details'

const AddConnectionsToGraph = (graph,id, conn)=>{
    if(!graph[id]) graph[id]=[]
    conn.forEach((key)=>{
        if(!graph[key]) graph[key]=[]        
        graph[key].push(id)
        graph[id].push(key)
    })
}

const Uniform = (dictionary, field)=>{
    let orderedSel = _.orderBy(Object.values(dictionary),field,'desc');
    
    let step = 100/orderedSel.length
    /*orderedSel.forEach((item, index)=>{
        dictionary[item.id][field] = init+step*index
    })*/
    let before = 0
    _.forEach(orderedSel, (item)=>{
        before +=step
        dictionary[item.id][field] = Math.floor(before)
        
    })
    return orderedSel
}
const UniformOrdered = ()=>{

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
const GetImportanceCandidate = (graph,id, artists)=>{
    let importance = 0
    graph[id].forEach((item)=>{
        importance+=artists[item].importance
    })
    return importance
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
        returnval+=multiplier
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
const GetClusters = (graph, artists)=>{
    let artistsVisited = {}
    let indexCluster = 0
    Object.keys(artists).forEach((id)=>{
        artistsVisited[id]=false    
    })
    Object.keys(artists).forEach((id)=>{
        if (artistsVisited[id]===false) {
            artistsVisited[id]=indexCluster
            DFSFunc(id, indexCluster)
            indexCluster++            
        }        
    })
    function DFSFunc(id, indexCluster){
        artistsVisited[id]=indexCluster
        if(graph[id]) graph[id].forEach((idneigh)=>{
            if(artistsVisited[idneigh]===false)DFSFunc(idneigh, indexCluster)
        })
    }
    let clusters = new Array(indexCluster);
    Object.keys(artistsVisited).forEach((artist)=>{
        let clusterid = artistsVisited[artist]
        if (!clusters[clusterid]) clusters[clusterid]=[]
        clusters[clusterid].push(artist)
    })
    return clusters
}
const GetColoredArtists = (artists, clusters)=>{
    let numPartition = 360/clusters.length
    let randomStart = Math.random()*360
    let newArtists = {...artists}

    clusters.forEach((list,index,array)=>{
        let hue = Math.round((index+1)*numPartition+randomStart)///(334+Math.random()*60)%360//
        list.forEach((key)=>{
            newArtists[key].radius = 5+newArtists[key].importance/10
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
        Uniform(artistsDic,'freshness')
        Uniform(artistsDic,'importance')
        let candidatesDic = {}
        let orderedList = 
        candidatesSelected.forEach((item)=>{
            let artist = nextProps.artistsCandidates[item]
            artist.importance = GetImportanceCandidate(graph, item, artistsDic)
            artist.id = item
            //newartist.connections = artist.connections
            candidatesDic[artist.id] = artist
        })
        let orderedCandidates = Uniform(candidatesDic,'importance')
        let allArtistsDic = {...artistsDic, ...candidatesDic};
        let clusters = GetClusters(graph, allArtistsDic)
        
        artistsDic = GetColoredArtists(allArtistsDic,clusters)
        let artists = Object.values(allArtistsDic)
        newState.orderedCandidates = orderedCandidates
        newState.nodes=artists
        newState.links= _.flatMap(artists,(item,index)=>{
            let key = item.id
            let edges = item.connections.map((item2,index,array)=>{
                return {"source": key, "target": item2, "value": 1}
            })
            return edges    
        })
        //this.DrawGraph(newState.nodes,newState.links)
        newState.graph = graph
        newState.createGraph = true
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

        svg.on('mousedown.fade', (d)=>{
            me.setState({selectedHue:null})
        }) 
        let distanceLinks = 25
        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().distance((d)=>{
                let returnval = distanceLinks+(me.state.graph[d.source.id].length+me.state.graph[d.target.id].length)//10*GetDistance(d.source,d.target)
               //console.log(d.source.name+" "+d.target.name+" "+returnval)
                return returnval
            }).strength(0.25).id(function(d) { return d.id; }))
            .force("charge", d3.forceManyBody().strength((d)=>{
                return -d.radius*20
            }))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x1", d3.forceX().strength(170/width))
            .force("y1", d3.forceY().strength(160/height))
            //.force("r", d3.forceRadial(0).strength(160/width))
         //x = 0.35*width -> 140
         //y = 0.15*height -> 120
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
            .call(drag)
            .on('mouseover.fade', (d)=> {
                if (d.timeoutIdOut){ 
                    window.clearTimeout(d.timeoutIdOut);  
                    d.timeoutIdOut=null;
                }else d.timeoutIdOver=window.setTimeout(function(){
                    d.timeoutIdOver=null; fade(d,0.1)},200)
            })
            .on('mouseout.fade', (d)=>{
                if (d.timeoutIdOver){ 
                    window.clearTimeout(d.timeoutIdOver);                    
                    d.timeoutIdOver=null;
                }else d.timeoutIdOut=window.setTimeout(function(){
                        d.timeoutIdOut=null;fade(d,1)},20)
                
            })
                   
        let circle = node.append("circle")
            .attr("r",(d)=>{
                let radius = d.radius
                if(width <500) radius*=width/600
                if(height <850) radius*=height/850
                return radius
            })
            .attr("fill", function(d) { 
                let alpha = d.order==0?1:0
                return  "hsla("+d.hue+",100%,45%,"+alpha+")"})
            .attr("stroke",(d)=>{
                let alpha = d.order==0?0:1
                return  "hsla("+d.hue+",100%,45%,"+alpha+")"
            })
            .attr("stroke-width",2)
            .on('mousedown.fade', (d)=>{
                me.setState({selectedHue:d.hue})
            }) 
           
            
        let text = node.append("text")
                //.append('tspan')
                .attr('text-anchor', 'middle')
                .attr('class','textnode')
                .attr("fill",'white')
                .text((d)=>{return d.name})
                .attr("font-size",(d)=>{return d.radius*2/3})
                .on('mousedown.fade', (d)=>{
                    me.setState({selectedHue:d.hue})
                }) 
                //.on('mousedown.fade', fade(0.1))        
                //.on('mouseout.fade', fade(1))

        simulation.on("tick", ticked);
        simulation
            .nodes(nodes)
            

        simulation.force("link")
            .links(links);
        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });
            if(width<600){
                circle
                .attr("cx", function(d) { return d.x=d.x})//Math.max(d.radius, Math.min(width - d.radius, d.x)); 
                .attr("cy", function(d) { return d.y=d.y});
            }else{
                circle
                .attr("cx", function(d) { return d.x=Math.max(d.radius, Math.min(width - d.radius, d.x));})// 
                .attr("cy", function(d) { return d.y=Math.max(d.radius, Math.min(height - d.radius, d.y));});//
            }
           
            text
                .attr("x", function(d) { return d.x; })
                .attr("y", function(d) { return d.y; });
        }
        let zoom = d3.zoom()
        .scaleExtent([1 / 2, 8])
        .on("zoom", zoomed)

        svg.call(zoom)
        //.call(zoom.transform, d3.zoomIdentity.scale(0.75).translate(width / 4, height / 4))
        function zoomed() {
            g1.attr("transform", d3.event.transform);
            g2.attr("transform", d3.event.transform);
        }
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.dragging = true
            d3.select(this).raise().classed("active", true);
        } 
        function dragged(d) {
            d.fx = d3.event.x// Math.max(d.radius, Math.min(width - d.radius, ));
            d.fy =  d3.event.y//Math.max(d.radius, Math.min(width - d.radius, d3.event.y));
        }
        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.dragging = false
            d3.select(this).classed("active", false);
            
        }
        const linkedByIndex = {};
        links.forEach(d => {
            linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
        });
        function isConnected(a, b) {
            return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
        }
        function fade(d, opacity) {
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
    render(){
        let me = this
        console.log('render'+ me.state.createGraph+' ')
        if(me.state.createGraph){
            
            if(!me.state.readyToDraw)me.setState({readyToDraw:true})
            else {
                me.setState({createGraph:false})
                me.DrawGraph()
            }
        }
        let styleDiv = {}
        let widthsvg = me.props.width
        let heightsvg = me.props.height
        let prop = 0.8
        if (widthsvg/heightsvg>1) {prop=0.7;widthsvg *= prop; }
        else heightsvg *= prop
        return(
            <div>
                <svg width={widthsvg} height={heightsvg}></svg>
                <Details selectedHue={me.state.selectedHue} orderedCandidates={me.state.orderedCandidates} prop={prop} width={me.props.width} height={me.props.height}/>
            </div>
            
            
        )
    }
}
    
   

export default Graph2;