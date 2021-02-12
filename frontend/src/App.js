import './App.css';
import React, { useState, useEffect } from 'react';
import { Grid, IconButton, Button } from '@material-ui/core'      
import { makeStyles } from '@material-ui/core/styles';
import LaunchIcon from '@material-ui/icons/Launch';
import DeleteIcon from '@material-ui/icons/Delete';
import axios from 'axios';
 
const useStyles = makeStyles((theme) => ({
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

const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Manwha Name', width: 220 },
  { field: 'lastChap', headerName: 'Chapter Read', width: 145},
  { field: 'latestChap', headerName: 'Latest Chapter', width: 150},
  { field:'link', headerName: 'Link', width: 500}
];

const rows = [
  { id: 1, name: 'Solo Leveling',lastChap: 138, latestChap:138, link:"https://earlymanga.org/manga/solo-leveling/chapter-138"},
  { id: 2, name: 'Tales of Demons and Gods',lastChap: 313.5,latestChap:138, link:"https://earlymanga.org/manga/solo-leveling/chapter-138"},
  { id: 3, name: 'FFF Class Trashero',lastChap: 73,latestChap:138, link:"https://earlymanga.org/manga/solo-leveling/chapter-138"},
];  


function App() {
  const [data, setData] = useState({ hits: [] });
 
  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(
        'localhost:5000/getManwhas',
      );
 
      setData(result.data);
      console.log(result.data);
    };
 
    fetchData();
  }, []);

  function openLink(url) {
    window.open(url, '_blank');
  }

  const classes = useStyles();
  const header = (
    <Grid container>
      <Grid item xs={3}>
        <span><strong>Name</strong></span>          
      </Grid>
      <Grid item xs={3}>
        <span><strong>Chapter Read</strong></span>
      </Grid>
      <Grid item xs={3}>
      <span><strong>Latest Chapter</strong></span>
      </Grid>        
      <Grid item xs={3}>
      <span>
        <strong>Link</strong>        
      </span>
      </Grid>
      <Grid item xs={12} style={{height:"4px", marginBottom:"10px"}}><hr/></Grid>
    </Grid>   
  );
  const table = rows.map((r) => {
    return (
      <Grid container>
        <Grid item xs={3}>
          <span>{r.name}</span>          
        </Grid>
        <Grid item xs={3}>
          <span>{r.lastChap}</span>
        </Grid>
        <Grid item xs={3}>
          <span>{r.latestChap}</span>
        </Grid>        
        <Grid item xs={3}>
          <Button variant="contained" color="primary" startIcon={<LaunchIcon/>} onClick={() => openLink(r.link)}>Read</Button>
          <IconButton aria-label="delete" className={classes.margin}>
            <DeleteIcon />
          </IconButton>
        </Grid>
        <Grid item xs={12} style={{height:"4px", marginBottom:"10px"}}><hr/></Grid>
      </Grid>   
    );
  });
  return (
    <div>
      <div className={classes.alignItemsAndJustifyContent}>
        <Button style={{margin:"20px"}} variant="contained" color="primary">Refresh</Button>
        <Button style={{margin:"20px"}} variant="contained" color="primary">Add Manwha</Button>        
      </div>
      <div style={{ width: '80%', marginLeft: '10%' }}>
        {header}
        {table} 
      </div>
    </div>
  );
}

export default App;
// ReactDOM.render(<App />, document.querySelector('#app'));