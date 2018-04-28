
import React,{Component}from 'react';
import Artist from './Artist'
import {InteractiveForceGraph, ForceGraphNode, ForceGraphLink} from 'react-vis-force';
import _ from 'lodash';
import Script from 'react-load-script'
const GetRandomPointsR2=(n, width, height)=>{
    let allpoints=[]
    for(let i=0;i<n;i++){
        let point = [Math.random() * width,Math.random() * height]
        allpoints.push(point)
    }
    return allpoints
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
        
        newState.readyToDraw =nextProps.readyToDraw
        if(newState.readyToDraw){
            let mapIdtoIndex = {}
            Object.keys(nextProps.data).forEach((item,index,array)=>{
                mapIdtoIndex[item]=index
            })
            let nodes = Object.keys(nextProps.data).map((key,index,array)=>{
                let node = _.pick(nextProps.data[key], ['importance','name', 'popularity'])
                node['id']=key
                return node
            })
            let links = []
            Object.keys(nextProps.data).forEach((item,index,array)=>{
                nextProps.data[item].neighbours.forEach((neighbour,indexn,array)=>{
                    
                    let link = {}
                    link['source']=index
                    link['target']=mapIdtoIndex[Object.keys(neighbour)[0]]
                    links.push(link)
                })
            })
            newState['nodes']=nodes
            newState['links']=links
        }
        return newState
    }
    componentDidMount(){
        //console.log(d3)
    }
    getEdges(){
        let me = this
        return _.flatMap(Object.keys(me.props.data),(item,index)=>{
            let edges = me.props.data[item].neighbours.map((item2,index,array)=>{
                let key2=Object.keys(item2)[0]
                return <ForceGraphLink strokeWidth={Math.random()*10} key={item+'to'+key2} link={{ source: item, target: key2 }} />
            })
            return edges    
        })
    }
    getNodes(){
        let me = this
        return _.map(Object.keys(me.props.data),(item,index)=>
        {
            return <ForceGraphNode key={item} r={me.props.data[item]['importance']} node={{ id: item, label: me.props.data[item]['name'] }} fill="red" showLabel/>
        }
        )
    }
    getGraph(width,height){
        let me = this
        let d3 = window.d3
       const chart = d3.select('.chart')
        .attr('width', width)
        .attr('height', height);
      
      //Creating tooltip
      const tooltip = d3.select('.container')
        .append('div')
        .attr('class', 'tooltip')
        .html('Tooltip');
      
      //Initializing force simulation
      const simulation = d3.forceSimulation()
        .force('link', d3.forceLink())
        .force('charge', d3.forceManyBody())
        .force('collide', d3.forceCollide())
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force("y", d3.forceY(0))
        .force("x", d3.forceX(0));
      
      
      //Drag functions
      const dragStart = d => {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      };
      
      const drag = d => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      };
      
      const dragEnd = d => {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      
      //Creating links
      const link = chart.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(me.state.links).enter()
        .append('line');
      
      //Creating nodes
      const node = d3.select('.chartContainer')
        .selectAll('div')
        .data(me.state.nodes).enter()
        .append('div')
        .attr('class', d => {return 'flag flag-' + d.code;})
        .call(d3.drag()
           .on('start', dragStart)
           .on('drag', drag)
           .on('end', dragEnd)
        ).on('mouseover',d => {
          tooltip.html(d.country)
            .style('left', d3.event.pageX + 5 +'px')
            .style('top', d3.event.pageY + 5 + 'px')
            .style('opacity', .9);
        }).on('mouseout', () => {
          tooltip.style('opacity', 0)
            .style('left', '0px')
            .style('top', '0px');
        });
      
      //Setting location when ticked
      const ticked = () => {
        link
          .attr("x1", d => { return d.source.x; })
          .attr("y1", d => { return d.source.y; })
          .attr("x2", d => { return d.target.x; })
          .attr("y2", d => { return d.target.y; });

      node
          .attr("style", d => { 
            return 'left: ' + d.x + 'px; top: ' + (d.y + 72) + 'px'; 
          });
      };
      
      //Starting simulation
      simulation.nodes(me.state.nodes)
        .on('tick', ticked);
      
      simulation.force('link')
        .links(me.state.links);
    
    
    }
    render(){
        let me = this
        const nodes = me.state.readyToDraw ? me.getNodes() : null
        const edges = me.state.readyToDraw ? me.getEdges() : null
        const graph = me.state.readyToDraw ? (
            <div className='chartContainer'>
                <svg className='chart'>
                </svg>
            </div>
          ) : (
            null
          );
        return(
            <div>{graph}
            </div>
        )
    }
}
    
   

export default Graph2;