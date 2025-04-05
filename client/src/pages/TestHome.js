import React from 'react';
import { Button, Typography, Container, Paper, Box } from '@mui/material';

const TestHome = () => {
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: 'center', backgroundColor: '#fff' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          CareerZoom Test Page
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          React is rendering correctly!
        </Typography>
        
        <Box sx={{ my: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body1" gutterBottom>
            Welcome to CareerZoom
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestHome;