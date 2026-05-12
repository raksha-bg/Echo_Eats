import React, { useState, useEffect, useCallback, useContext } from 'react';
import 'regenerator-runtime/runtime';
import { useNavigate } from 'react-router-dom';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { GlobalStateContext } from '../context/GlobalStateContext';
import './CSS/Voice.css';

const VoiceAssistant = () => {
  const { setTogg, Togg, foodData, updateQuantity, logout } = useContext(GlobalStateContext);
  const navigate = useNavigate();
  const [assistantResponse, setAssistantResponse] = useState('How can I help you?');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const speakResponse = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleCommand = useCallback(async (aiData) => {
    const { command, page, category, item_id, quantity, response } = aiData;
    
    if (response) {
      setAssistantResponse(response);
      speakResponse(response);
    }

    switch (command) {
      case 'NAVIGATE':
        if (page === 'checkout') {
          navigate('/cart#payment-modal');
        } else if (page === 'menu' || page === 'items') {
          navigate('/#items');
        } else if (page) {
          navigate(page === 'home' ? '/' : `/${page}`);
        }
        break;

      case 'ORDER':
        if (item_id) {
          const item = foodData.find(f => f.FoodID === parseInt(item_id));
          if (item) {
            await updateQuantity(item.FoodID, quantity || 1);
            setStatusMessage(`Added ${quantity || 1} ${item.FoodName} to cart`);
            setTimeout(() => setStatusMessage(''), 3000);
          } else {
            const errorMsg = 'Item not found in our menu.';
            setAssistantResponse(errorMsg);
            speakResponse(errorMsg);
          }
        }
        break;

      case 'REMOVE':
        if (item_id) {
          const item = foodData.find(f => f.FoodID === parseInt(item_id));
          if (item && item.Quantity > 0) {
            const removeQty = Math.min(item.Quantity, quantity || 1);
            await updateQuantity(item.FoodID, -removeQty);
            setStatusMessage(`Removed ${removeQty} ${item.FoodName} from cart`);
            setTimeout(() => setStatusMessage(''), 3000);
          }
        }
        break;

      case 'FILTER':
        if (category) {
          // You might need a filter state in GlobalStateContext to make this work
          // For now, we navigate to home to show items
          navigate('/');
        }
        break;

      case 'LOGOUT':
        await logout();
        break;

      default:
        break;
    }
  }, [navigate, foodData, updateQuantity, logout, speakResponse]);

  const processTranscript = useCallback(async (text) => {
    if (!text) return;
    setIsProcessing(true);
    setStatusMessage('Thinking...');

    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();
      
      if (data.aiResponse) {
        await handleCommand(data.aiResponse);
      } else {
        throw new Error('No AI response');
      }
    } catch (error) {
      console.error("Voice Fetch Error:", error);
      const errorMsg = 'I had trouble connecting to the brain. Please check your internet or API key.';
      setAssistantResponse(errorMsg);
      speakResponse(errorMsg);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
      resetTranscript();
    }
  }, [handleCommand, speakResponse, resetTranscript]);

  useEffect(() => {
    if (!listening && transcript) {
      processTranscript(transcript);
    }
  }, [listening, transcript, processTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  const startAssistant = async () => {
    try {
      // Clear any existing speech
      window.speechSynthesis?.cancel();
      resetTranscript();
      setAssistantResponse('Listening...');
      
      // Attempt to start listening
      await SpeechRecognition.startListening({ 
        continuous: false, 
        language: 'en-IN' 
      });
    } catch (err) {
      console.error("Mic Error:", err);
      setAssistantResponse("Microphone access denied or not available. Please check settings.");
      speakResponse("Microphone access denied. Please allow microphone access.");
    }
  };

  if (!Togg) {
    return (
      <div className="voice-assistant-floating">
        <button className="floating-voice-button" onClick={() => setTogg(true)} title="Open Voice Assistant">
          <span className="mic-icon">🎤</span>
        </button>
      </div>
    );
  }

  return (
    <div className="voice-assistant-overlay">
      <div className="voice-assistant-card">
        <button className="close-assistant" onClick={() => setTogg(false)}>×</button>
        <div className="assistant-header">
          <div className={`mic-status ${listening ? 'listening' : ''}`}>
             {listening ? '🔵' : '⚪'}
          </div>
          <h3>Voice Assistant</h3>
        </div>
        
        <div className="assistant-display">
          <p className="transcript-text">{transcript || 'Say something like "Order 2 Pizza"'}</p>
          <div className="response-box">
             <p className="response-text">{assistantResponse}</p>
          </div>
          {statusMessage && <div className="status-toast">{statusMessage}</div>}
        </div>

        <button 
          className={`action-button ${listening ? 'listening' : ''}`} 
          onClick={listening ? SpeechRecognition.stopListening : startAssistant}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : (listening ? 'Stop Listening' : 'Tap to Speak')}
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
