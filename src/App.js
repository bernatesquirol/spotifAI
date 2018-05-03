import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import queryString from 'query-string'
import _ from 'lodash';
import { Stage, Layer, Rect, Text } from "react-konva";
import Konva from 'konva';

import Graph from './Graph'
import Graph2 from './Graph2'
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
      createGraph:false,
      enqueued: 0
    }
    
  }
  checkIfDone(){
    if(this.state.enqueued==0){
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
    me.setState((prevState)=>({enqueued:prevState.enqueued+1}))
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
        //this.getArtists(0,0,'short_term')
        //this.getArtists(2,0,'medium_term')
        //this.getArtists(5,0,'long_term')
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
          newartist.genres = item['genres'],
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
      }}).then(()=>me.checkIfDone())
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
        <Graph2 height={window.innerHeight*0.95} createGraph={true} width={window.innerWidth*0.95} artists={artistsOffline}  artistsCandidates={artistsCandidatesOffline}/>        
        
      </div>
    );
  }
}

export default App;
//<Graph height={window.innerHeight} createGraph={this.state.createGraph} width={window.innerWidth} artists={me.state.artists}  artistsCandidates={me.state.artistsCandidates}/>
const artistsOffline = {"4DBi4EYXgiqbkxvWUXUzMi":{"tops":{"medium_term":0},"name":"Old Crow Medicine Show","genres":["alternative country","bluegrass","folk","folk-pop","jam band","new americana","old-time","progressive bluegrass","roots rock","stomp and holler","traditional folk"],"popularity":60,"order":0,"connections":[]},"4tZwfgrHOc3mvqYlEYSvVi":{"tops":{"medium_term":1},"name":"Daft Punk","genres":["electro","electronic","filter house"],"popularity":82,"order":0,"connections":[]},"0op3EnoEZ0jQY13sbyoSo2":{"tops":{"long_term":0},"name":"Els Amics De Les Arts","genres":["cantautor","rock catala","spanish folk"],"popularity":49,"order":0,"connections":["503mwh1GWEiWy9bzzpiTFW"]},"503mwh1GWEiWy9bzzpiTFW":{"tops":{"long_term":1},"name":"Antònia Font","genres":["cantautor","rock catala","spanish indie pop"],"popularity":44,"order":0,"connections":[]},"0kbYTNQb4Pb1rPbbaF0pT4":{"tops":{"long_term":2},"name":"Miles Davis","genres":["bebop","contemporary post-bop","cool jazz","hard bop","jazz","jazz blues","jazz fusion","jazz trumpet","vocal jazz"],"popularity":67,"order":0,"connections":[]},"7Ln80lUS6He07XvHI8qqHH":{"tops":{"long_term":3},"name":"Arctic Monkeys","genres":["garage rock","indie rock","modern rock","permanent wave","sheffield indie"],"popularity":84,"order":0,"connections":[]},"0XNa1vTidXlvJ2gHSsRi4A":{"tops":{"long_term":4},"name":"Franz Ferdinand","genres":["alternative rock","dance-punk","garage rock","indie rock","modern rock","new rave","rock"],"popularity":70,"order":0,"connections":["7Ln80lUS6He07XvHI8qqHH"]}}
const artistsCandidatesOffline = {"63knPlGzLHTNDf1J78Fvte":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"The Devil Makes Three","genres":["new americana","progressive bluegrass","stomp and holler"],"popularity":57,"order":2},"0PPMo9gDxneTAzxeF1MU3J":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"The Hackensaw Boys","genres":["bluegrass","new americana","progressive bluegrass"],"popularity":34,"order":2},"6H8Sj9gFyDYJ3T63LA3DKz":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"Carolina Chocolate Drops","genres":["bluegrass","jug band","new americana","old-time","progressive bluegrass","traditional folk"],"popularity":42,"order":2},"3GjVVVcFmUgEJEAAsbGkf4":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"Trampled by Turtles","genres":["bluegrass","folk-pop","indie folk","jam band","new americana","progressive bluegrass","roots rock","stomp and holler"],"popularity":58,"order":2},"4tlnuBsCPe8BHUuADPvUSL":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"Dave Rawlings Machine","genres":["alternative country","country blues","country rock","deep new americana","folk","folk rock","folk-pop","indie folk","modern blues","new americana","outlaw country","piedmont blues","progressive bluegrass","roots rock","singer-songwriter","stomp and holler","texas country","traditional folk"],"popularity":51,"order":2},"3M2LPcqyD4PxbOFvtF05R7":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"Chatham County Line","genres":["alternative country","bluegrass","new americana","progressive bluegrass","roots rock"],"popularity":35,"order":2},"3znXuXT3xkCtjgOxXBBVnq":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"Justin Townes Earle","genres":["alternative country","country rock","deep new americana","folk","folk-pop","funk","indie folk","modern blues","new americana","outlaw country","progressive bluegrass","roots rock","singer-songwriter","stomp and holler","texas country","traditional folk"],"popularity":52,"order":2},"1ReHC2jB2DGoPbMYhzuFuO":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"Yonder Mountain String Band","genres":["bluegrass","jam band","new americana","progressive bluegrass","roots rock","string band"],"popularity":48,"order":2},"3bLSAQPeix7Xm2e5Gtn48R":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"The Steeldrivers","genres":["bluegrass","new americana","progressive bluegrass"],"popularity":58,"order":2},"7yTltkMBvChBkA86Tz8WfW":{"connections":["4DBi4EYXgiqbkxvWUXUzMi"],"name":"The Infamous Stringdusters","genres":["bluegrass","jam band","new americana","progressive bluegrass","roots rock"],"popularity":49,"order":2},"1gR0gsQYfi6joyO1dlp76N":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Justice","genres":["alternative dance","dance-punk","disco house","electro house","electronic","filter house","indietronica","new rave"],"popularity":63,"order":2},"1GhPHrq36VKCY3ucVaZCfo":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"The Chemical Brothers","genres":["alternative dance","big beat","breakbeat","electronic","new rave","trip hop"],"popularity":64,"order":2},"0UF7XLthtbSF2Eur7559oV":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Kavinsky","genres":["alternative dance","disco house","filter house","new rave","retro electro"],"popularity":60,"order":2},"2fBURuq7FrlH6z5F92mpOl":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Digitalism","genres":["alternative dance","big beat","dance-punk","disco house","electro house","electroclash","electronic","indietronica","new rave","synthpop"],"popularity":56,"order":2},"0iui2Be5CP8EWxvHYsVspL":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Breakbot","genres":["alternative dance","disco house","filter house","indietronica","new rave","nu disco"],"popularity":57,"order":2},"4YrKBkKSVeqDamzBPWVnSJ":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Basement Jaxx","genres":["alternative dance","big beat","disco house","electronic","hip house","house","new rave","uk garage","vocal house"],"popularity":58,"order":2},"37uLId6Z5ZXCx19vuruvv5":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Hot Chip","genres":["alternative dance","art pop","chillwave","dance-punk","electronic","indie pop","indie rock","indietronica","modern rock","new rave","synthpop","trip hop"],"popularity":62,"order":2},"2CIMQHirSU0MQqyYHq0eOx":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"deadmau5","genres":["big room","edm","electro house","progressive house"],"popularity":69,"order":2},"4Y7tXHSEejGu1vQ9bwDdXW":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Fatboy Slim","genres":["big beat","disco house","electronic"],"popularity":65,"order":2},"5nPOO9iTcrs9k6yFffPxjH":{"connections":["4tZwfgrHOc3mvqYlEYSvVi"],"name":"Röyksopp","genres":["alternative dance","big beat","downtempo","electronic","new rave","synthpop","trip hop"],"popularity":62,"order":2},"7Ix9GNTGIUIFBpPC6K0QeP":{"connections":["0op3EnoEZ0jQY13sbyoSo2"],"name":"Lax'n'Busto","genres":["cantautor","catalan folk","rock catala"],"popularity":43,"order":2},"0OVfimlbekXaMrP8IoCzHJ":{"connections":["0op3EnoEZ0jQY13sbyoSo2","503mwh1GWEiWy9bzzpiTFW"],"name":"Els Pets","genres":["cantautor","catalan folk","rock catala"],"popularity":43,"order":2},"6zXhOyC07G4spYTHFLm7oo":{"connections":["0op3EnoEZ0jQY13sbyoSo2","503mwh1GWEiWy9bzzpiTFW"],"name":"Joan Miquel Oliver","genres":["cantautor","rock catala"],"popularity":41,"order":2},"2E7iSyZ5Mv8x5mGu1RcKzT":{"connections":["0op3EnoEZ0jQY13sbyoSo2","503mwh1GWEiWy9bzzpiTFW"],"name":"Mishima","genres":["cantautor","rock catala","spanish indie pop"],"popularity":44,"order":2},"3ebwHQYvONnv8xIrW2wYDA":{"connections":["0op3EnoEZ0jQY13sbyoSo2","503mwh1GWEiWy9bzzpiTFW"],"name":"Whiskyn's","genres":["cantautor","catalan folk","rock catala"],"popularity":29,"order":2},"3eAm5IYwnH7uTX5EBT9sbi":{"connections":["0op3EnoEZ0jQY13sbyoSo2"],"name":"Gertrudis","genres":["cantautor","rock catala","rumba"],"popularity":42,"order":2},"798kDjwOnvYR4iLHoDR3Gl":{"connections":["0op3EnoEZ0jQY13sbyoSo2","503mwh1GWEiWy9bzzpiTFW"],"name":"Gossos","genres":["cantautor","rock catala"],"popularity":40,"order":2},"3xvSV6NiocgZuGdVK3n0lE":{"connections":["0op3EnoEZ0jQY13sbyoSo2","503mwh1GWEiWy9bzzpiTFW"],"name":"Sanjosex","genres":["cantautor","catalan folk","rock catala"],"popularity":33,"order":2},"40tHhop0T30DwienQBmTxb":{"connections":["0op3EnoEZ0jQY13sbyoSo2","503mwh1GWEiWy9bzzpiTFW"],"name":"Manel","genres":["cantautor","rock catala","spanish folk"],"popularity":51,"order":2},"0InCPtI0kadS7s3cZrcbbY":{"connections":["0op3EnoEZ0jQY13sbyoSo2"],"name":"Els Catarres","genres":["cantautor","rock catala"],"popularity":55,"order":2},"03FGY5MFUz7JNP6yYbiceB":{"connections":["503mwh1GWEiWy9bzzpiTFW"],"name":"Quimi Portet","genres":["cantautor","rock catala"],"popularity":36,"order":2},"4gQzCU2uamGf9aX5DMOnuV":{"connections":["503mwh1GWEiWy9bzzpiTFW"],"name":"Adrià Puntí","genres":["cantautor","rock catala"],"popularity":31,"order":2},"0fTHKjepK5HWOrb2rkS5Em":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Freddie Hubbard","genres":["avant-garde jazz","bebop","big band","contemporary jazz","contemporary post-bop","cool jazz","free jazz","hard bop","jazz","jazz blues","jazz funk","jazz fusion","jazz trumpet","latin jazz","soul jazz","stride","swing","vocal jazz"],"popularity":50,"order":2},"1VEzN9lxvG6KPR3QQGsebR":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Sonny Rollins","genres":["bebop","big band","contemporary post-bop","cool jazz","hard bop","jazz","jazz blues","jazz fusion","jazz saxophone","soul jazz","stride","vocal jazz"],"popularity":56,"order":2},"2hGh5VOeeqimQFxqXvfCUf":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"John Coltrane","genres":["bebop","contemporary post-bop","cool jazz","free jazz","hard bop","jazz","jazz blues","jazz fusion","jazz saxophone"],"popularity":66,"order":2},"0ZqhrTXYPA9DZR527ZnFdO":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Wayne Shorter","genres":["avant-garde jazz","bebop","contemporary jazz","contemporary post-bop","cool jazz","free jazz","hard bop","indonesian jazz","jazz","jazz blues","jazz funk","jazz fusion","jazz saxophone","soul jazz","vocal jazz"],"popularity":53,"order":2},"71Ur25Abq58vksqJINpGdx":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Miles Davis Quintet","genres":["bebop","contemporary post-bop","cool jazz","hard bop","jazz","jazz fusion","soul jazz"],"popularity":45,"order":2},"5RzjqfPS0Bu4bUMkyNNDpn":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Dizzy Gillespie","genres":["bebop","big band","contemporary post-bop","cool jazz","hard bop","jazz","jazz blues","jazz trumpet","latin jazz","soul jazz","swing","vocal jazz"],"popularity":53,"order":2},"4Ww5mwS7BWYjoZTUIrMHfC":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Charlie Parker","genres":["adult standards","bebop","big band","contemporary post-bop","cool jazz","hard bop","jazz","jazz blues","jazz saxophone","soul jazz","swing","vocal jazz"],"popularity":54,"order":2},"1W8TbFzNS15VwsempfY12H":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Charles Mingus","genres":["avant-garde jazz","bebop","contemporary post-bop","cool jazz","free jazz","hard bop","jazz","jazz blues","jazz double bass","jazz electric bass","jazz fusion"],"popularity":56,"order":2},"4PDpGtF16XpqvXxsrFwQnN":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Thelonious Monk","genres":["bebop","contemporary post-bop","cool jazz","hard bop","jazz","jazz blues","jazz fusion","jazz piano","vocal jazz"],"popularity":58,"order":2},"5v74mT11KGJqadf9sLw4dA":{"connections":["0kbYTNQb4Pb1rPbbaF0pT4"],"name":"Cannonball Adderley","genres":["bebop","big band","contemporary post-bop","cool jazz","hard bop","jazz","jazz blues","jazz funk","jazz fusion","soul jazz","stride","swing","vocal jazz"],"popularity":54,"order":2},"4fSPtBgFPZzygkY6MehwQ7":{"connections":["7Ln80lUS6He07XvHI8qqHH","0XNa1vTidXlvJ2gHSsRi4A"],"name":"The Libertines","genres":["alt-indie rock","alternative rock","britpop","dance-punk","garage rock","indie rock","madchester","modern rock","new rave","rock"],"popularity":61,"order":2},"0epOFNiUfyON9EYx7Tpr6V":{"connections":["7Ln80lUS6He07XvHI8qqHH"],"name":"The Strokes","genres":["alternative rock","garage rock","indie pop","indie rock","modern rock","permanent wave","rock"],"popularity":75,"order":2},"3M4ThdJR28z9eSMcQHAZ5G":{"connections":["7Ln80lUS6He07XvHI8qqHH","0XNa1vTidXlvJ2gHSsRi4A"],"name":"The Fratellis","genres":["alternative rock","garage rock","indie rock","modern rock"],"popularity":66,"order":2},"0LbLWjaweRbO4FDKYlbfNt":{"connections":["7Ln80lUS6He07XvHI8qqHH","0XNa1vTidXlvJ2gHSsRi4A"],"name":"Kaiser Chiefs","genres":["alternative rock","britpop","garage rock","indie rock","modern rock","rock"],"popularity":63,"order":2},"2Z7UcsdweVlRbAk5wH5fsf":{"connections":["7Ln80lUS6He07XvHI8qqHH","0XNa1vTidXlvJ2gHSsRi4A"],"name":"The Last Shadow Puppets","genres":["garage rock","indie rock","modern rock","new rave","sheffield indie"],"popularity":64,"order":2},"11wRdbnoYqRddKBrpHt4Ue":{"connections":["7Ln80lUS6He07XvHI8qqHH","0XNa1vTidXlvJ2gHSsRi4A"],"name":"Kasabian","genres":["alternative rock","britpop","electronic","garage rock","indie rock","modern rock","rock"],"popularity":69,"order":2},"3MM8mtgFzaEJsqbjZBSsHJ":{"connections":["7Ln80lUS6He07XvHI8qqHH","0XNa1vTidXlvJ2gHSsRi4A"],"name":"Bloc Party","genres":["alternative dance","alternative rock","dance-punk","electronic","garage rock","indie pop","indie rock","indietronica","modern rock","new rave","rock","synthpop"],"popularity":64,"order":2},"450iujbtN6XgiA9pv6fVZz":{"connections":["7Ln80lUS6He07XvHI8qqHH"],"name":"Razorlight","genres":["britpop","garage rock","indie rock","madchester","modern rock","neo mellow","pop rock"],"popularity":60,"order":2},"1GLtl8uqKmnyCWxHmw9tL4":{"connections":["7Ln80lUS6He07XvHI8qqHH"],"name":"The Kooks","genres":["garage rock","indie rock","modern rock"],"popularity":73,"order":2},"6e9wIFWhBPHLE9bXK8gtBI":{"connections":["0XNa1vTidXlvJ2gHSsRi4A"],"name":"Editors","genres":["chamber pop","dance-punk","garage rock","indie rock","modern rock","new rave","rock"],"popularity":64,"order":2},"3WaJSfKnzc65VDgmj2zU8B":{"connections":["0XNa1vTidXlvJ2gHSsRi4A"],"name":"Interpol","genres":["alternative dance","alternative rock","dance-punk","garage rock","indie pop","indie rock","indietronica","modern rock","new rave","rock"],"popularity":67,"order":2},"0IBAqjHG8DSaD7PPCGnGiZ":{"connections":["0XNa1vTidXlvJ2gHSsRi4A"],"name":"Babyshambles","genres":["britpop","dance-punk","garage rock","indie rock","modern rock","new rave","punk blues"],"popularity":53,"order":2},"2qlAMLpUyBjZgnzuFXXZXI":{"connections":["0XNa1vTidXlvJ2gHSsRi4A"],"name":"Klaxons","genres":["alternative dance","dance-punk","garage rock","indie rock","indietronica","modern rock","new rave","synthpop"],"popularity":56,"order":2}}