import React, { Component } from 'react';
import './App.css';
import queryString from 'query-string'
import Graph2 from './Graph2'
import Me from './Me.json'
import {AsyncPriorityQueue, AsyncTask} from 'async-priority-queue'
import spotifyico from './spotify.svg'
const paramsToQuery = (params) => {
  let esc = encodeURIComponent;
  let query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
  return query
}

// const GetLoginDiv = (width,height,link,sampledataonclick)=>(
//   <div style={{height:height*0.5,width:Math.min(width*0.5,600), align:'center',backgroundColor:'white',position: 'absolute', top:0, bottom: 0, 
//   left: 0, right: 0, margin: 'auto', borderRadius:20
//   }}>
//   <a href={link} > 
//     Login to spotify
//     </a>
//     <button onClick={sampledataonclick}>
//     Sample data
//   </button>
//   </div>
// )
// const containerWidth = window.innerWidth
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
      createGraph:false,
      enqueued: 0,
      maxEnqueued: 0,
    }
    
  }
  checkIfDone(){
    if(this.state.enqueued===0){
      //console.log(JSON.stringify(this.state.artists))
      //console.log(JSON.stringify(this.state.artistsCandidates))
      this.setState({createGraph:true})
      
    }
  }

  fetchSpotify(link){
    let me = this
    let task = new AsyncTask({
      priority: 'high',
      callback: function() {
        me.setState((prevState)=>({enqueued:prevState.enqueued-1}))
        return fetch(link,{
          headers: {'Authorization': 'Bearer '+me.state.token}
        }).then(response => response.json())
      }
    })
    me.setState((prevState)=>({enqueued:prevState.enqueued+1, maxEnqueued:prevState.maxEnqueued+1}))
    queue.enqueue(task);
    return task.promise
  }
  componentDidMount(){
    let parsed = queryString.parse(window.location.hash)
    let access_token = parsed.access_token
    if (access_token) {
      this.setState({
        token:access_token,        
      },()=>{
        queue.start()
        this.getArtists(30,0,'short_term')
        this.getArtists(30,0,'medium_term')
        this.getArtists(30,0,'long_term')
      })
    }
  }
  getArtists(limit=50, offset=0, time_range='medium_term', callback=null){ 
    /*
    *Optional. Over what time frame the affinities are computed. Valid values: long_term (calculated from several years of data and including all new data as it becomes available), medium_term (approximately last 6 months), short_term (approximately last 4 weeks). Default: medium_term.
    */   
    let params = {
        limit: limit,
        offset: offset,
        time_range: time_range
    };
    let me = this
    let query = paramsToQuery(params)
    me.fetchSpotify('https://api.spotify.com/v1/me/top/artists?'+query)    
    .then(jsondata=>
      {
      if (jsondata['items']){
      jsondata['items'].forEach((item,index,array) => {
        let id = item['id']
        me.setState(prevState => {
          let artists = {...prevState.artists}
          let newartist = {...artists[id]}
          let beforetops = newartist.tops || {}
          beforetops[time_range]=index
          newartist.tops=beforetops
          newartist.name = item['name']
          newartist.genres = item['genres']
          newartist.popularity = item['popularity']
          newartist.order = 0
          newartist.connections = []
          artists[id] = newartist
          
          return {artists: artists}
        },()=>me.getArtistDetails(id,2))
    })}
    })
  }
  getArtistDetails(id, order){
    //me.setState((prevState)=>())
    let me = this
    me.fetchSpotify('https://api.spotify.com/v1/artists/'+id+'/related-artists')
    .then(jsondata=>{
      if (jsondata['artists']){
        jsondata['artists'].slice(0,10).forEach((item,index,array)=>{
        let idneighbour = item['uri'].substr(item['uri'].indexOf('artist:')+7)
        
        me.setState(prevState => {
          //let linksartist = prevState.links[idneighbour]?[...prevState.links[idneighbour]]:[]
          let returnstate = {}
          let artistismain = false
          let artist = prevState.artists[idneighbour]
          if(artist==null) artist = prevState.artistsCandidates[idneighbour]
          else artistismain = true
          if(artist==null){
            artist = {}
            artist.connections = []
            artist.name =  item['name']
            artist.genres = item['genres']
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
      }}).then(()=>me.checkIfDone())
  }
   
  sampleData(){
    let me = this
    me.setState(()=>({
      artistsCandidates: Me.artistsCandidates,
      artists: Me.artists,
      
    }),()=>{me.setState({token:true,createGraph:true})})
  }

  render() {
    let me = this
    let link = 'https://accounts.spotify.com/authorize?scope=user-top-read&response_type=token&client_id=d6ecd46788d1428f85da28f281f1d5f9&redirect_uri='+window.location.protocol+'//'+window.location.host+'/callback'
    // http://localhost:3000'//'https://spotifai-backend.herokuapp.com/login' //'http://localhost:8888/login'
    //console.log('renderingagain  '+me.state.createGraph)
    let loading = me.state.enqueued/me.state.maxEnqueued
    
    return (
      <div className="App" >
        { this.state.token==null?
        
        <div className="title" style={{marginTop:containerHeight/2-100}}>
          Discover how <img alt="nophoto" src={spotifyico} width='100em' style={{paddingTop:'50px'}}/> works
          
          <p style={{fontSize:'5vw'}}><a href={link}>Login</a> or <a onClick={()=>{me.sampleData()}} href="/#" >use sample data</a>  </p>
          
          
        </div>
        :
          (
            me.state.createGraph? (
            <Graph2 height={window.innerHeight} 
            createGraph={me.state.createGraph} 
            width={window.innerWidth*0.95} 
            artists={me.state.artists}  
            artistsCandidates={me.state.artistsCandidates}/> )
            :  (
            <div className="title" style={{marginTop:window.innerHeight/2-100}}>Loading { Math.round((1-loading)*100)}%</div>
          )
         
          )
          
        }
               
        
      </div>
    );
  }
}

export default App;
