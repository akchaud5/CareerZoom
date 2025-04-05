import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import api from '../../utils/api';

/**
 * Component for controlling voice-over playback of interview questions
 */
const VoiceOverControls = ({ 
  questionId, 
  isEnabled = false, 
  onEnableChange = () => {}, 
  voiceType = 'alloy',
  onVoiceChange = () => {}
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const audioRef = useRef(null);
  
  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setVoicesLoading(true);
        const response = await api.get('/api/voices');
        setVoices(response.data);
      } catch (err) {
        console.error('Error fetching voices:', err);
        setError('Failed to load voice options.');
      } finally {
        setVoicesLoading(false);
      }
    };
    
    fetchVoices();
  }, []);
  
  // Play audio for the current question
  const playQuestionAudio = async () => {
    try {
      if (!questionId) return;
      
      setLoading(true);
      setError('');
      
      // Get audio URL with selected voice
      const audioUrl = `/api/questions/${questionId}/audio?voice=${voiceType}`;
      
      // If there's already an audio element, clean it up
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Create a new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        setLoading(false);
        setIsPlaying(true);
        audio.play();
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio. Please try again.');
        setLoading(false);
        setIsPlaying(false);
      });
      
    } catch (err) {
      console.error('Error playing question audio:', err);
      setError('Failed to play audio. Please try again.');
      setLoading(false);
      setIsPlaying(false);
    }
  };
  
  // Stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Voice-Over Options
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isEnabled}
              onChange={(e) => onEnableChange(e.target.checked)}
              name="voiceOver"
              color="primary"
            />
          }
          label="Enable Voice-Over"
        />
        
        {isEnabled && (
          <>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="voice-type-label">Voice</InputLabel>
              <Select
                labelId="voice-type-label"
                value={voiceType}
                onChange={(e) => onVoiceChange(e.target.value)}
                label="Voice"
                disabled={voicesLoading}
              >
                {voices.map((voice) => (
                  <MenuItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {questionId && (
              <IconButton 
                color="primary" 
                onClick={isPlaying ? stopAudio : playQuestionAudio}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : isPlaying ? (
                  <StopIcon />
                ) : (
                  <VolumeUpIcon />
                )}
              </IconButton>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 1, width: '100%' }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default VoiceOverControls;