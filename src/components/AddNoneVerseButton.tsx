import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress } from '@mui/material';
import { addNoneVerseEntities } from '../utils/noneverse-entities';

/**
 * AddNoneVerseButton Component
 * 
 * A button that, when clicked, opens a dialog to confirm adding NoneVerse elements
 * to the database.
 */
const AddNoneVerseButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | {
    success: boolean;
    message: string;
  }>(null);

  const handleOpen = () => {
    setOpen(true);
    setResult(null);
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
  };

  const handleAdd = async () => {
    setLoading(true);
    try {
      const data = await addNoneVerseEntities();
      setResult({
        success: true,
        message: `Successfully added NoneVerse world, ${data.characters?.length || 0} characters, and ${data.locations?.length || 0} locations.`
      });
    } catch (error) {
      console.error('Error adding NoneVerse entities:', error);
      setResult({
        success: false,
        message: `Error adding NoneVerse entities: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Add NoneVerse World
      </Button>
      
      <Dialog
        open={open}
        onClose={loading ? undefined : handleClose}
        aria-labelledby="noneverse-dialog-title"
        aria-describedby="noneverse-dialog-description"
      >
        <DialogTitle id="noneverse-dialog-title">
          Add NoneVerse Elements
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="noneverse-dialog-description">
            {!result ? (
              <>
                This will add the NoneVerse story world, along with 3 characters and 2 locations to your database.
                <ul>
                  <li><strong>Characters:</strong> Vex Hollow, Mira Latch, Drav Thorne</li>
                  <li><strong>Locations:</strong> The Hollow Market, The Recursion Library</li>
                </ul>
                Do you want to proceed?
              </>
            ) : result.success ? (
              <span style={{ color: 'green' }}>{result.message}</span>
            ) : (
              <span style={{ color: 'red' }}>{result.message}</span>
            )}
          </DialogContentText>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <CircularProgress />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {result ? (
            <Button onClick={handleClose} color="primary" autoFocus>
              Close
            </Button>
          ) : (
            <>
              <Button onClick={handleClose} color="secondary" disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleAdd} color="primary" autoFocus disabled={loading}>
                Add NoneVerse
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddNoneVerseButton;
