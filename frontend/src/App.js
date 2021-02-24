import './App.css';
import AddDialog from './AddDialog';
import React, { useState, useEffect } from 'react';
import { Grid, IconButton, Button, TextField } from '@material-ui/core'      
import { makeStyles } from '@material-ui/core/styles';
import LaunchIcon from '@material-ui/icons/Launch';
import DeleteIcon from '@material-ui/icons/Delete';
import axios from 'axios';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

 
const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
  alignItemsAndJustifyContent: {
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },  
}));

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#3f51b5',
    },
  },
  typography: {
    fontSize: 16,
  },
});

function App() {
  const [data, setData] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
   
  const fetchData = async () => {
    const result = await axios(
      'http://localhost:5000/getManwhas',
    );

    const data = result.data.map((d) => {
      let convertedData = {}
      Object.assign(convertedData, d)
      convertedData.chapterRead = d.chapterRead.toString()
      if(d.readHalf) {
        convertedData.chapterRead += ".5";
      }
      return convertedData;
    });

    sortData(data);
    setData(data);
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  function sortData(data){
    data.sort(function(a,b){
      var aNewChapters = parseInt(a.latestChapter-a.chapterRead);
      var bNewChapters = parseInt(b.latestChapter-b.chapterRead);

      if(aNewChapters>bNewChapters){
        return -1;
      }
      if(aNewChapters<bNewChapters){
        return 1;
      }
      if(a.currentlyHalf && !a.readHalf){
        if(!b.currentlyHalf || b.readHalf){
          return -1;
        }
      }
      if(b.currentlyHalf && !b.readHalf){
        if(!a.currentlyHalf || a.readHalf){
          return 1;
        }
      }
      return a.name.localeCompare(b.name);
    });
  }

  function openLink(url) {
    window.open(url, '_blank');
  }

  function refresh() {
    const postRefresh = async () => {
      await axios.post(
        'http://localhost:5000/updateManwha',
      );
      fetchData();
    }

    postRefresh();
  }

  function saveChapterRead(id) {
    const postUpdateRead = async(d) => {
      await axios.post(
        'http://localhost:5000/updateRead', d
      );
    }

    console.log("Data", data);
    data.forEach((d) => {
      if(d.id==id) {
        d.readHalf = (d.chapterRead.endsWith(".5"));

        d.chapterRead = parseInt(d.chapterRead);
        console.log("Updating read", d);
        postUpdateRead(d);
        if(d.readHalf){
          d.chapterRead=d.chapterRead.toString();
          d.chapterRead=d.chapterRead+".5"
        }
      }      
    });
    
    sortData(data);
    setData([...data]);
  }

  function deleteManwha(id){
    const postDeleteManwha = async(id) => {
      await axios.post(
        'http://localhost:5000/deleteManwha', {"id":id}
      );
      fetchData();
    }

    postDeleteManwha(id);
  }

  function handleAddClosed(isSave, halfIncChecked,name,url,chapterRead){
    if(isSave && name !="" && url != "" && chapterRead != ""){
      var site = getSite(url);
      if (site == ""){
        setAddOpen(false);
        return;
      }

      if (url[url.length - 1]!="/"){
        url = url +"/"
      }
      
      var chapterReadInt = parseInt(chapterRead);
      var halfIncRead = !(chapterRead % 1 == 0);
      var jsonData = {
        "name":name,
        "baseUrl":url + "chapter-",
        "website":site,
        "latestChapter":chapterReadInt,
        "chapterRead":chapterReadInt,
        "readHalf":halfIncRead,
        "halfInc":halfIncChecked,
        "currentlyHalf":halfIncRead
      }
      createManwha(jsonData);
    }

    setAddOpen(false);
  }

  function getSite(url){
    if(url.includes("earlymanga")) {return "EM"}
    if(url.includes("mangatx")) {return "Other"}
    if(url.includes("mangakik")) {return "Other"}
    if(url.includes("manhuaplus")) {return "Other"}
    return "";
  }

  function createManwha(jsonData){
    const postCreateManwha = async(jsonData) => {
      await axios.post(
        'http://localhost:5000/createManwha', jsonData
      );
      fetchData();
    }

    postCreateManwha(jsonData);
  }

  function handleChangeChapterRead(event, id) {
    const newData = data.map((d) => {
      if(d.id==id) {
        d.chapterRead = event.target.value;
        d.readHalf = (d.chapterRead.endsWith(".5"));
      }
      return d;
    });
    setData(newData);
  }

  const classes = useStyles();
  const header = (
    <Grid container>
      <Grid item xs={5} xl={7}>
        <span><strong>Name</strong></span>          
      </Grid>
      <Grid item xs={2} xl={1} className="alignCentre">
        <span><strong>Chapter Read</strong></span>
      </Grid>
      <Grid item xs={2} xl={1} className="alignCentre">
      <span><strong>Latest Chapter</strong></span>
      </Grid>        
      <Grid item xs={1} className="alignCentre">
      <span>
        <strong>Link</strong>        
      </span>
      </Grid>        
      <Grid item xs={2}>   
      </Grid>
      <Grid item xs={12} style={{height:"4px", marginBottom:"10px"}}><hr/></Grid>
    </Grid>   
  );
  const table = data.map((r) => {
    let link="";
    if(r.halfInc && !r.readHalf) {
      link = r.baseURL + r.chapterRead + "-5";
    } else {
      link = r.baseURL + (parseInt(r.chapterRead)+1).toString();
    }
    
    return (
      <Grid container key={r.id}>
        <Grid item xs={5}  xl={7}>
          <span>{r.name}</span>
        </Grid>
        <Grid item xs={2} xl={1} className="alignCentre chapterRead">
          <TextField
            label=""
            value={r.chapterRead}
            onChange={(event) => handleChangeChapterRead(event, r.id)}
            onBlur={() => saveChapterRead(r.id)}
          />          
        </Grid>
        <Grid item xs={2} xl={1} className="alignCentre">
          <span>{r.latestChapter}{(r.currentlyHalf)?".5":""}</span>
        </Grid>        
        <Grid item xs={1} className="alignCentre">
          <Button variant="contained" color={(r.latestChapter<=r.chapterRead&&r.readHalf==r.currentlyHalf)?"grey":"secondary"} startIcon={<LaunchIcon/>} onClick={() => openLink(link)}>Read</Button>
        </Grid>        
        <Grid item xs={2} className="deleteBtn">        
          <IconButton aria-label="delete" style={{float:"right"}} size="small" className={classes.margin} onClick={() => deleteManwha(r.id)}>
            <DeleteIcon />
          </IconButton>
        </Grid>
        <Grid item xs={12} style={{height:"4px", marginBottom:"10px"}}><hr/></Grid>
      </Grid>   
    );
  });
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
    <div>
      <div className={classes.alignItemsAndJustifyContent}>
        <Button style={{margin:"20px"}} variant="contained" color="secondary" onClick={refresh}>Refresh</Button>
        <Button style={{margin:"20px"}} variant="contained" color="secondary" onClick={() => {setAddOpen(true)}}>Add Manwha</Button>        
      </div>
      <div style={{ width: '66%', marginLeft: '17%' }}>
        {header}
        {table} 
      </div>
      <AddDialog open={addOpen} onClose={handleAddClosed}/>
    </div>
    
    </ThemeProvider>
  );
}

export default App;