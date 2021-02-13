import React, {useEffect, useState}  from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

export default function AddDialog(props) {
  const [halfIncChecked, setHalfIncChecked] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [chapterRead, setChapterRead] = useState("");

  function handleClose(isSave) {
    props.onClose(isSave, halfIncChecked,name,url,chapterRead);
  }

  useEffect(() => {
    if(props.open) {
      setHalfIncChecked(false);
      setName("");
      setUrl("");
      setChapterRead("");
    }
  }, [props.open]);

  return (
    <div>
      <Dialog open={props.open} onClose={() => handleClose(false)} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Add Manwha</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the details of the Manwha you want to add
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            value={name}
            onChange={(event) => setName(event.target.value)}
            id="name"
            label="Name"
            fullWidth
          />
          <TextField
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            margin="dense"
            id="url"
            label="Url"
            fullWidth
          />
          <TextField
            value={chapterRead}
            onChange={(event) => setChapterRead(event.target.value)}
            margin="dense"
            id="chapterRead"
            label="Chapter Read"
            fullWidth
          />
          <FormControlLabel
          control={
            <Checkbox
              checked={halfIncChecked}
              onChange={(event) => {setHalfIncChecked(event.currentTarget.checked)}}
              name="halfIncChecked"
              color="primary"
            />
          }
          label="Increment is in halves"
        />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose(false)} color="white">
            Cancel
          </Button>
          <Button onClick={() => handleClose(true)} color="white">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
