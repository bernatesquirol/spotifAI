import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import queryString from 'query-string'

import _ from 'lodash';
import { Stage, Layer, Rect, Text } from "react-konva";
import Konva from 'konva';
import Track from './Track'
import {InteractiveForceGraph, ForceGraphNode, ForceGraphLink} from 'react-vis-force';
const paramsToQuery = (params) => {
  let esc = encodeURIComponent;
  let query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
  return query
}
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

const containerWidth = window.innerWidth
const containerHeight = window.innerHeight
class App extends Component {
  constructor(){
    super();
    this.state = {
      token: null,
      artists: {},
    }
  }
  fetchSpotify(link){
    let me = this
    
    return fetch(link,{
      headers: {'Authorization': 'Bearer '+me.state.token}
    }).then(response => response.json())
  }
  componentDidMount(){
    
    let parsed = queryString.parse(window.location.search)

    let access_token = parsed.access_token
    if (access_token) {
      this.setState({
        token:access_token,
        tracks:{}
      },()=>{this.getArtists(50,0,'short_term',
              ()=>{this.getArtists(50,0,'medium_term',
                ()=>{this.getArtists(50,0,'long_term',()=>{this.constructGraph()})})
              })
            })
      
    }
    
  }
  getArtists(limit=50, offset=0, time_range='medium_term', callback=null){    
    let params = {
        limit: limit,
        offset: offset,
        time_range: time_range
    };
    let me = this
    let query = paramsToQuery(params)
    let promisesAll = []
    let counter = 0
    let promiseLinksTopArtists = me.fetchSpotify('https://api.spotify.com/v1/me/top/artists?'+query)
    .then(jsondata=>
      jsondata['items'].forEach((item,index,array) => {
        let id = item['id']
        counter++
        let promiseState = me.setState(prevState => {
          let artists = {...prevState.artists}
          let newartist = {...artists[id]}
          newartist.name = item['name']
          newartist.genres = item['genres'],
          newartist.popularity = item['popularity']
          if (!newartist.importance) newartist.importance = 0
          newartist.importance += GetImportance(time_range)
          artists[id] = newartist
          return {
            artists: artists
          }
        })
        promisesAll.push(promiseState)
        if(counter==array.length){
          Promise.all(promisesAll).then(()=>{
            if(callback) callback()
          })
        }
    }))
    promisesAll.push(promiseLinksTopArtists)
  }
  constructGraph(){
    var me = this
    let graph = {}
    let artistslist = Object.values(me.state.artists).map((val,index,array)=>{
      let newval = {...val}
      newval['id']=Object.keys(me.state.artists)[index]
      return newval
    })
    artistslist.forEach((artist,index,array)=>{
      let neighbours = []
      artistslist.forEach((artist2,index2,array2)=>{
        if(artist!=artist2){
          let intersectionlength = artist.genres.filter(function(n) {
            return artist2.genres.indexOf(n) !== -1;
          }).length;
          if (intersectionlength > 0){
            let obj = {}
            obj[artist2.id]=intersectionlength
            neighbours.push(obj)
          }
        }        
      })
      graph[artist.id]=neighbours
    })
    Object.keys(graph).forEach((id)=>{
      me.setState((prevState)=>{
        let artists = {...prevState.artists}
        let newartist = artists[id]
        newartist['neighbours']=graph[id]
        artists[id]=newartist
        return {
          artists: artists
        }
      })
    })
    
  }
  scaleOutput(output,width, height, offsetX=0,offsetY=0){
    let xs = output.map((data)=>(data[0]))
    let ys = output.map((data)=>(data[1]))
    let minxs = Math.min(...xs)
    let minys = Math.min(...ys)
    let xdiff = Math.abs(Math.max(...xs)-minxs)
    let ydiff = Math.abs(Math.max(...ys)-minys)
    console.log(Math.max(minxs))
    console.log(xs)
    let newoutput = output.map((data)=>([Math.round((data[0]-minxs)*width/xdiff),Math.round((data[1]-minys)*height/ydiff)]))
    console.log(newoutput)
    return newoutput
    
  }  
  

  render() {
    let me = this
    return (
      <div className="App">
        { this.state.token==null?<a href='http://localhost:8888/login' > Login to Spotify </a>:
          null
        }
        <InteractiveForceGraph  zoom simulationOptions={{ height: window.innerHeight, width: window.innerWidth }}>
        
          
        {
          me.state.artists?Object.values(me.state.artists).map((artist,index)=>{
            let id = Object.keys(me.state.artists)[index]
            return <ForceGraphNode key={id} node={{ id: id }} fill="red" />
        }):null
        }
        
          
        </InteractiveForceGraph>
      </div>
    );
  }
}

export default App;
