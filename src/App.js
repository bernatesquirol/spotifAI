import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import queryString from 'query-string'
import _ from 'lodash';
import { Stage, Layer, Rect, Text } from "react-konva";
import Konva from 'konva';

import Graph from './Graph'
import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'
const paramsToQuery = (params) => {
  let esc = encodeURIComponent;
  let query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
  return query
}


const containerWidth = window.innerWidth
const containerHeight = window.innerHeight
const  queue = new AsyncPriorityQueue({debug:false,maxParallel:1,processingFrequency:20});
class App extends Component {
  constructor(){
    super();
    this.state = {
      token: null,
      artists: {},
      artistsCandidates:{},
      links: {},
      createGraph:false   
    }
    
  }
  checkIfDone(){
    console.log(queue)
  }

  fetchSpotify(link){
    let me = this
    let task = new AsyncTask({
      priority: 'high',
      callback: function() {
        return fetch(link,{
          headers: {'Authorization': 'Bearer '+me.state.token}
        }).then(response => response.json())
      }
    })
    queue.enqueue(task);
    return task.promise
  }
  componentDidMount(){
    let parsed = queryString.parse(window.location.search)
    let access_token = parsed.access_token
    if (access_token) {
      this.setState({
        token:access_token,        
      },()=>{
        queue.start()
        this.getArtists(50,0,'short_term')
        this.getArtists(50,0,'medium_term')
        this.getArtists(50,0,'long_term')
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
    me.fetchSpotify('https://api.spotify.com/v1/me/top/artists?'+query)
    .then(jsondata=>
      jsondata['items'] ?
      jsondata['items'].forEach((item,index,array) => {
        let id = item['id']
        me.setState(prevState => {
          let artists = {...prevState.artists}
          let newartist = {...artists[id]}
          let beforetops = newartist.tops || {}
          beforetops[time_range]=index
          newartist.tops=beforetops
          newartist.name = item['name']
          newartist.genres = item['genres'],
          newartist.popularity = item['popularity']
          newartist.order = 0
          newartist.connections = []
          artists[id] = newartist
          
          return {artists: artists}
        },()=>me.getArtistDetails(id,2))
    }):null)
  }
  getArtistDetails(id, order){
    //me.setState((prevState)=>())
    let me = this
    me.fetchSpotify('https://api.spotify.com/v1/artists/'+id+'/related-artists')
    .then(jsondata=>
      jsondata['artists']?
      jsondata['artists'].slice(0,10).forEach((item,index,array)=>{
        let idneighbour = item['uri'].substr(item['uri'].indexOf('artist:')+7)
        
        me.setState(prevState => {
          //let linksartist = prevState.links[idneighbour]?[...prevState.links[idneighbour]]:[]
          let link = {}
          let returnstate = {}
          let artistismain = false
          let artist = prevState.artists[idneighbour]
          if(artist==null) artist = prevState.artistsCandidates[idneighbour]
          else artistismain = true
          if(artist==null){
            artist = {}
            artist.connections = []
            artist.name =  item['name']
            artist.genres = item['genres'],
            artist.popularity = item['popularity']
            artist.order = order
            //artistsC[idneighbour] = artist
            //returnstate.artistsCandidates = artistsC            
          }

          if(artist.connections.indexOf(id)<0 && prevState.artists[id].connections.indexOf(idneighbour)<0 ){
            artist.connections.push(id)
          } 
          if(artistismain){
            let artists = {...prevState.artists}
            artists[idneighbour] = artist
            returnstate.artists = artists
          }else{
            let artists = {...prevState.artistsCandidates}
            artists[idneighbour]=artist
            returnstate.artistsCandidates = artists
          }   
          return returnstate
        })
              
      })
      :null)
  }
  constructGraph(){
    var me = this
    let graph = {}
    let artistslist = Object.values(me.state.artists).map((val,index,array)=>{
      let newval = {...val}
      newval['id']=Object.keys(me.state.artists)[index]
      return newval
    })
    let links = []
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
    let promises = []
    me.setState((prevState)=>{
      
    })
    Object.keys(graph).forEach((id)=>{
      let promise = me.setState((prevState)=>{
        let artists = {...prevState.artists}
        let newartist = artists[id]
        newartist['neighbours']=graph[id]
        artists[id]=newartist
        return {
          artists: artists
        }
      })
      promises.push(promise)
    })
    Promise.all(promises).then(()=>{
      me.setState({createGraph:true})
    })
    
  }
   
  

  render() {
    let me = this
    return (
      <div className="App">
        { this.state.token==null?<a href='http://localhost:8888/login' > Login to Spotify </a>:
          null
        }
        <Graph height={window.innerHeight} createGraph={this.state.createGraph} width={window.innerWidth} artists={me.state.artists}  artistsCandidates={me.state.artistsCandidates}/>
        
      </div>
    );
  }
}

export default App;
