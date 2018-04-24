import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import queryString from 'query-string'
import TSNE from 'tsne-js';
import _ from 'lodash';
import { Stage, Layer, Rect, Text } from "react-konva";
import Konva from 'konva';
import Track from './Track'
const paramsToQuery = (params) => {
  let esc = encodeURIComponent;
  let query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
  return query
}
const model = new TSNE({
  dim: 2,
  perplexity: 80.0,
  earlyExaggeration: 4.0,
  learningRate: 100.0,
  nIter: 10,
  metric: 'euclidean'
});
const containerWidth = window.innerWidth
const containerHeight = window.innerHeight
class App extends Component {
  constructor(){
    super();
    this.state = {
      token: null,
      tracks: {},
      dimensions: {
        width: -1,
        height: -1
      }
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
      },this.getTracks)
      
    }
    
  }
  getTracks(limit=50, offset=0, time_range='medium_term'){    
    let params = {
        limit: limit,
        offset: offset,
        time_range: time_range
    };
    let me = this
    let query = paramsToQuery(params)
    let promiseLinksTopTracks = me.fetchSpotify('https://api.spotify.com/v1/me/top/tracks?'+query)
    .then(jsondata=>
      jsondata['items'].map(item => {
        let id = item['href'].substring(item['href'].indexOf('tracks')+7,item['href'].length)
        let link = item['href'].replace('tracks','audio-features')
        me.setState(prevState => {
          let newtracks = {...prevState.tracks}
          let newtrack = {...newtracks[id]}
          newtrack.name = item['name']
          newtrack.artist = item['artists'][0]['name'],
          newtrack.link = link
          newtrack.preview_url = item['preview_url']
          newtracks[id] = newtrack
          return {
            tracks: newtracks
          }
        })
        return link
    }))
    let promisesState = []
    let promiseAnalysis = promiseLinksTopTracks.then(value => { 
      let counter = 0
      value.forEach((link,index,array) => me.fetchSpotify(link).then(response => {
        let id = response.id
        let promiseState = me.setState(prevState => {
          let newtracks = {...prevState.tracks}
          let newtrack = {...newtracks[id]}        
          newtrack.analysis = _.pick(response,['acousticness','danceability','energy'])//,'energy','instrumentalness','loudness','valence','key','time_signature','tempo','liveness','speechiness',
          newtrack['link']=null
          newtracks[id] = newtrack    
          return {
            tracks: newtracks
          }
        })

        promisesState.push(promiseState)
        counter++
        console.log(counter)
        console.log(index)
        if (counter==array.length){
          Promise.all(promisesState).then(()=>{
            let tracksdic = Object.keys(me.state.tracks).reduce((map,id)=>{
              map[id]=Object.values(me.state.tracks[id].analysis)
              return map
            },{})
            me.initTSNE(tracksdic)
            let output = me.runTSNE()
            output = me.scaleOutput(output, containerWidth, containerHeight)
            me.updateStateWithTSNE(tracksdic,output)
          })
        }
      }))      
    })
  }
  initTSNE(tracksdic){
    model.init({
      data: Object.values(tracksdic),
      type: 'dense'
    });
  }
  runTSNE(){
    console.log('alldone')
    let me = this
    model.run();
    let output = model.getOutput();
    //console.log(output)
    return output
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
  updateStateWithTSNE(dictionary,output){
    let me = this
    let promises = []
    Object.keys(dictionary).forEach((id,index,array)=>{
      let promise = me.setState(prevState => {
        let newtracks = {...prevState.tracks}
        let newtrack = {...newtracks[id]}
        newtrack['x']=output[index][0]
        newtrack['y']=output[index][1]
        newtracks[id] = newtrack      
        return {
          tracks: newtracks
        }
      })
      promises.push(promise)
    })
    Promise.all(promises,()=>{
      setInterval(function() {
        model.rerun()
      }, 5000);
    })
  }

  render() {
    let me = this
    return (
      <div className="App">
        { this.state.token==null?<a href='http://localhost:8888/login' > Login to Spotify </a>:
          null
        }
        <Stage width={containerWidth} height={containerHeight}>
        <Layer>
        {
          Object.values(me.state.tracks).map((track)=>{
            return <Track x={track.x} y={track.y} name={track.name}/>
          })
        }
        </Layer>
        </Stage>
      
      </div>
    );
  }
}

export default App;
