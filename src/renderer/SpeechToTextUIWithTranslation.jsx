import React, { useState, useEffect, useRef } from 'react';
import { Mic, Pause, Save, Copy, Trash2, Maximize2, Minimize2, ChevronUp, ChevronDown, Globe, Check } from 'lucide-react';

// Simple function to translate Farsi to English
const translateToEnglish = (text) => {
  const dictionary = {
    'سلام': 'Hello',
    'خوبی': 'How are you',
    'چطوری': 'How are you',
    'ممنون': 'Thank you',
    'متشکرم': 'Thanks',
    'خداحافظ': 'Goodbye',
    'باشه': 'Okay',
    'بله': 'Yes',
    'نه': 'No',
    'من': 'I',
    'تو': 'You',
    'او': 'He/She',
    'ما': 'We',
    'شما': 'You (plural)',
    'آنها': 'They',
    'این': 'This',
    'آن': 'That',
    'کجا': 'Where',
    'چرا': 'Why',
    'چگونه': 'How',
    'چه': 'What',
    'کی': 'Who',
    'زمان': 'Time',
    'مکان': 'Place',
    'کتاب': 'Book',
    'قلم': 'Pen',
    'کامپیوتر': 'Computer',
    'موبایل': 'Mobile',
    'خانه': 'Home',
    'کار': 'Work',
    'دوست': 'Friend',
    'خانواده': 'Family',
    'غذا': 'Food',
    'آب': 'Water',
    'نان': 'Bread',
    'میز': 'Table',
    'صندلی': 'Chair',
    'در': 'Door',
    'پنجره': 'Window',
    'روز': 'Day',
    'شب': 'Night',
    'صبح': 'Morning',
    'عصر': 'Evening',
    'ماه': 'Month',
    'سال': 'Year',
    'امروز': 'Today',
    'فردا': 'Tomorrow',
    'دیروز': 'Yesterday',
    'خوب': 'Good',
    'بد': 'Bad',
    'بزرگ': 'Big',
    'کوچک': 'Small',
    'زیبا': 'Beautiful',
    'زشت': 'Ugly',
    'سریع': 'Fast',
    'آهسته': 'Slow',
    'گرم': 'Hot',
    'سرد': 'Cold',
  };
  
  // Simulate network delay
  return new Promise(resolve => {
    setTimeout(() => {
      const words = text.split(/\s+/);
      const translatedWords = words.map(word => {
        const cleanWord = word.replace(/[.,!?؛،:؟]/g, '');
        return dictionary[cleanWord] || word;
      });
      resolve(translatedWords.join(' '));
    }, 300);
  });
};

// Mock speech recognition for preview
const mockSpeechRecognition = {
  start: () => console.log('Starting speech recognition'),
  stop: () => console.log('Stopping speech recognition'),
  isRecognizing: () => true,
  onResult: (callback) => {
    const phrases = [
      "سلام، این یک نمونه متن گفتار به نوشتار است. ",
      "صدای شما در حال تبدیل به متن است. ",
      "سیستم به صورت بلادرنگ گفتار را تایپ می‌کند. ",
      "این سیستم می‌تواند گفتار شما را به صورت ریل‌تایم به نوشتار تبدیل کند. ",
      "طراحی مینیمال و زیبا برای تجربه کاربری بهتر. ",
      "با استفاده از این ابزار می‌توانید متن‌های طولانی را به راحتی تایپ کنید. "
    ];
    
    let currentIndex = 0;
    let fullText = '';
    
    const interval = setInterval(() => {
      if (currentIndex < phrases.length) {
        fullText += phrases[currentIndex];
        callback(fullText, false);
        currentIndex++;
      } else {
        clearInterval(interval);
        callback(fullText, true);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }
};

// WebSpeech API class for real speech recognition
class WebSpeechRecognition {
  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'fa-IR';
      
      this.isListening = false;
      this.resultCallbacks = [];
      this.errorCallbacks = [];
      
      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          this.resultCallbacks.forEach(callback => callback(finalTranscript, true));
        } else if (interimTranscript) {
          this.resultCallbacks.forEach(callback => callback(interimTranscript, false));
        }
      };
      
      this.recognition.onerror = (event) => {
        this.errorCallbacks.forEach(callback => callback(event.error));
      };
      
      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition.start();
        }
      };
    } else {
      console.error('Speech recognition not supported in this browser');
    }
  }
  
  start() {
    if (this.recognition) {
      this.isListening = true;
      this.recognition.start();
    }
  }
  
  stop() {
    if (this.recognition) {
      this.isListening = false;
      this.recognition.stop();
    }
  }
  
  isRecognizing() {
    return this.isListening;
  }
  
  onResult(callback) {
    this.resultCallbacks.push(callback);
    return () => {
      this.resultCallbacks = this.resultCallbacks.filter(cb => cb !== callback);
    };
  }
  
  onError(callback) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }
}

// Use WebSpeech if available, otherwise use mock
const speechRecognition = window.webkitSpeechRecognition 
  ? new WebSpeechRecognition() 
  : mockSpeechRecognition;

// Main component
const SpeechToTextUIWithTranslation = () => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [savedTranscripts, setSavedTranscripts] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [minimizedMode, setMinimizedMode] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(100);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFloatingWidgetActive, setIsFloatingWidgetActive] = useState(true);
  
  // Animation states
  const [waveAmplitude, setWaveAmplitude] = useState([]);
  const [typingIndex, setTypingIndex] = useState(0);
  
  // Refs
  const transcriptContainerRef = useRef(null);
  const widgetRef = useRef(null);

  // Draggable floating widget
  useEffect(() => {
    const widget = widgetRef.current;
    if (!widget) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    const startDragging = (e) => {
      initialX = e.clientX - currentX;
      initialY = e.clientY - currentY;
      isDragging = true;
    };

    const stopDragging = () => {
      isDragging = false;
    };

    const drag = (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        widget.style.left = `${currentX}px`;
        widget.style.top = `${currentY}px`;
      }
    };

    widget.addEventListener('mousedown', startDragging);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('mousemove', drag);
    
    // Initial position
    currentX = window.innerWidth - 300;
    currentY = 50;
    widget.style.left = `${currentX}px`;
    widget.style.top = `${currentY}px`;

    return () => {
      widget.removeEventListener('mousedown', startDragging);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('mousemove', drag);
    };
  }, []);

  // Load saved transcripts
  useEffect(() => {
    if (window.speechToText?.getSavedTranscripts) {
      window.speechToText.getSavedTranscripts()
        .then(transcripts => {
          if (transcripts && transcripts.length > 0) {
            setSavedTranscripts(transcripts);
          }
        })
        .catch(err => console.error('Error loading saved transcripts:', err));
    }
  }, []);
  
  // Save transcripts when they change
  useEffect(() => {
    if (window.speechToText?.saveTranscripts) {
      window.speechToText.saveTranscripts(savedTranscripts);
    }
  }, [savedTranscripts]);
  
  // Initialize wave animation
  useEffect(() => {
    const initialWave = Array(60).fill(0).map(() => Math.random() * 20);
    setWaveAmplitude(initialWave);
  }, []);
  
  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);
  
  // Wave animation effect
  useEffect(() => {
    let animationFrame;
    if (isRecording) {
      const animateWave = () => {
        setWaveAmplitude(prev => {
          return prev.map((_, idx) => {
            // Create complex wave pattern with multiple frequencies
            const wave1 = Math.sin(Date.now() * 0.002 + idx * 0.15) * 20;
            const wave2 = Math.sin(Date.now() * 0.001 + idx * 0.1) * 15;
            const wave3 = Math.cos(Date.now() * 0.003 + idx * 0.05) * 10;
            const centerEffect = 20 * Math.exp(-0.01 * Math.pow(idx - prev.length/2, 2) / (prev.length/4));
            const combinedHeight = (wave1 + wave2 + wave3 + centerEffect) * (confidenceLevel / 100);
            return Math.max(15, combinedHeight + (Math.random() * 5));
          });
        });
        animationFrame = requestAnimationFrame(animateWave);
      };
      animationFrame = requestAnimationFrame(animateWave);
    } else {
      setWaveAmplitude(prev => prev.map(() => 5));
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isRecording, confidenceLevel]);
  
  // Handle keyboard shortcut
  useEffect(() => {
    if (window.speechToText?.onToggleRecording) {
      const unsubscribe = window.speechToText.onToggleRecording(() => {
        toggleRecording();
      });
      return () => {
        unsubscribe();
      };
    }
  }, []);
  
  // Handle automatic translation
  useEffect(() => {
    let timeoutId;
    if (transcript && !isTranslating) {
      timeoutId = setTimeout(() => {
        setIsTranslating(true);
        translateToEnglish(transcript)
          .then(result => {
            setTranslation(result);
            setIsTranslating(false);
          })
          .catch(() => {
            setIsTranslating(false);
          });
      }, 1000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [transcript]);
  
  // Set up speech recognition
  useEffect(() => {
    const unsubscribeResult = speechRecognition.onResult((text, isFinal) => {
      if (isRecording) {
        if (isFinal) {
          setTranscript(prev => {
            const needsSpace = prev && !prev.endsWith(' ') && !text.startsWith(' ');
            const newText = prev + (needsSpace ? ' ' : '') + text;
            return newText;
          });
          setConfidenceLevel(85 + Math.floor(Math.random() * 15));
        }
        if (transcriptContainerRef.current) {
          transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
        setTypingIndex(prev => prev + 1);
      }
    });
    return () => {
      unsubscribeResult();
    };
  }, [isRecording]);
  
  // Helper functions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    if (newRecordingState) {
      setTranscript('');
      setTypingIndex(0);
      setTranslation('');
      speechRecognition.start();
    } else {
      speechRecognition.stop();
    }
  };
  
  const resetRecording = () => {
    if (isRecording) {
      speechRecognition.stop();
    }
    setIsRecording(false);
    setTranscript('');
    setRecordingTime(0);
    setTypingIndex(0);
    setTranslation('');
  };
  
  const toggleMinimizedMode = () => {
    setMinimizedMode(!minimizedMode);
    setIsFloatingWidgetActive(!minimizedMode);
  };
  
  const toggleTranslation = () => {
    setTranslationOpen(!translationOpen);
  };
  
  const getTextWithConfidence = (text) => {
    if (!text) return [];
    const words = text.split(' ');
    return words.map((word) => {
      const individualConfidence = Math.min(100, confidenceLevel - (Math.random() * 15));
      return { word, confidence: individualConfidence };
    });
  };
  
  const saveTranscript = () => {
    if (transcript.trim()) {
      const newTranscript = { 
        text: transcript, 
        time: new Date().toLocaleTimeString('fa-IR'), 
        duration: formatTime(recordingTime),
        date: new Date().toLocaleDateString('fa-IR'),
        translation: translation
      };
      setSavedTranscripts(prev => [...prev, newTranscript]);
      resetRecording();
    }
  };
  
  const copyTranscript = () => {
    if (transcript.trim()) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(transcript);
      } else if (window.speechToText?.pasteText) {
        window.speechToText.pasteText(transcript);
      }
    }
  };
  
  const copyTranslation = () => {
    if (translation.trim()) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(translation);
      } else if (window.speechToText?.pasteText) {
        window.speechToText.pasteText(translation);
      }
    }
  };
  
  const pasteTextAtCursor = (text) => {
    if (text.trim() && window.speechToText?.pasteText) {
      window.speechToText.pasteText(text);
    } else if (text.trim() && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const deleteSavedTranscript = (index) => {
    setSavedTranscripts(prev => prev.filter((_, i) => i !== index));
  };
  
  const themeClass = "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-800";
  
  const getConfidenceColor = (confidence) => {
    if (confidence > 90) return 'text-gray-800';
    if (confidence > 75) return 'text-gray-700';
    if (confidence > 60) return 'text-gray-600';
    return 'text-gray-500';
  };
  
  const minimizeApp = () => {
    if (window.speechToText?.minimizeApp) {
      window.speechToText.minimizeApp();
    }
  };
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-500 ${themeClass}`}>
      {isFloatingWidgetActive && !minimizedMode && (
        <div
          ref={widgetRef}
          className="fixed z-50 w-64 bg-white bg-opacity-90 backdrop-blur-md rounded-xl shadow-md p-3 flex items-center justify-between"
          style={{
            borderLeft: '1px solid rgba(255, 255, 255, 0.4)',
            borderTop: '1px solid rgba(255, 255, 255, 0.4)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="flex items-center space-x-2">
            <div className="relative h-9 w-9 flex items-center justify-center bg-white bg-opacity-80 rounded-full shadow-sm mr-3">
              {isRecording ? (
                <>
                  <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-30"></div>
                  <Pause size={16} className="text-red-500" />
                </>
              ) : (
                <Mic size={16} className="text-blue-500" />
              )}
            </div>
            <span className="text-xs text-blue-900">
              {isRecording ? 'ضبط صدا...' : 'آماده برای ضبط'}
            </span>
          </div>
          
          <div className="flex-1 px-3 max-w-xs mx-2 overflow-hidden">
            {isRecording ? (
              <div className="px-3 py-1.5 bg-white bg-opacity-70 rounded-lg shadow-inner w-full overflow-hidden whitespace-nowrap"
                   style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                <p className="text-xs text-blue-900 text-right overflow-hidden" style={{ direction: 'rtl' }}>
                  {transcript.slice(-25)}
                  <span className="inline-block w-1 h-3 mr-1 bg-blue-500 animate-blink align-middle rounded-sm"/>
                </p>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg w-full">
                <p className="text-xs text-blue-800 text-right opacity-60" style={{ direction: 'rtl' }}>
                  میکروفون را فعال کنید...
                </p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors shadow-sm"
              onClick={toggleRecording}
            >
              {isRecording ? <Pause size={14} className="text-red-500" /> : <Mic size={14} className="text-blue-500" />}
            </button>
            <button 
              className="p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors shadow-sm"
              onClick={toggleMinimizedMode}
            >
              <Maximize2 size={14} className="text-blue-500" />
            </button>
          </div>
        </div>
      )}

      <div 
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 transform ${
          isRecording ? 'scale-[1.02]' : 'scale-100'
        } ${minimizedMode ? 'max-h-32' : ''}`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.2), 0 0 15px rgba(147, 197, 253, 0.3)'
        }}
      >
        <div className="absolute top-4 right-4 z-10 flex space-x-2 draggable-area">
          <button 
            onClick={toggleMinimizedMode}
            className="p-2 rounded-full bg-white bg-opacity-20 backdrop-blur-md hover:bg-opacity-30 transition-all duration-300"
          >
            {minimizedMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>
        
        <div className="relative h-36 overflow-hidden draggable-area">
          <div 
            className="absolute inset-0 transition-all duration-700"
            style={{
              background: isRecording 
                ? 'linear-gradient(135deg, #6366f1, #ec4899)'
                : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              opacity: minimizedMode ? 0.9 : 1
            }}
          />
          
          <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end">
            {waveAmplitude.map((height, index) => (
              <div key={index} className="relative flex-1">
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all rounded-t-full bg-gradient-to-t from-white to-white/50"
                  style={{ 
                    height: `${isRecording ? height : 5}%`,
                    transitionDuration: `${0.2 + Math.random() * 0.3}s`,
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white">
            <div className="flex items-center backdrop-blur-sm bg-black bg-opacity-10 px-3 py-1 rounded-full">
              {isRecording && (
                <div className="relative mr-2 w-3 h-3">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  <div className="absolute inset-0 bg-red-500 rounded-full"></div>
                </div>
              )}
              <span className="text-xs text-white">
                {isRecording ? 'درحال ضبط' : 'آماده ضبط (Alt+Space)'}
              </span>
            </div>
            <div className="font-mono backdrop-blur-sm bg-black bg-opacity-10 px-3 py-1 rounded-full text-xs">
              {formatTime(recordingTime)}
            </div>
          </div>
          
          {isRecording && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
              <div className="flex items-center backdrop-blur-sm bg-black bg-opacity-10 px-2 py-1 rounded-full">
                <span className="ml-1 mr-1">دقت:</span>
                <div className="w-16 h-1.5 bg-white bg-opacity-30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all duration-300"
                    style={{ width: `${confidenceLevel}%` }}
                  />
                </div>
                <span className="ml-1">{confidenceLevel}%</span>
              </div>
            </div>
          )}
          
          <button
            onClick={toggleRecording}
            className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-20 h-20 flex items-center justify-center rounded-full shadow-xl transition-all duration-500 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            style={{
              boxShadow: isRecording 
                ? '0 0 15px rgba(239, 68, 68, 0.6), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
                : '0 0 15px rgba(59, 130, 246, 0.6), 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              animation: isRecording 
                ? 'pulse-red 2s infinite cubic-bezier(0.66, 0, 0, 1)' 
                : 'none',
              zIndex: 10
            }}
          >
            {isRecording ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
            {!isRecording && (
              <>
                <div className="absolute w-2.5 h-14 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full" 
                     style={{top: '100%'}}></div>
                <div className="absolute w-10 h-2.5 bg-gradient-to-r from-blue-700 to-blue-600 rounded-full" 
                     style={{top: 'calc(100% + 12px)'}}></div>
              </>
            )}
          </button>
        </div>
        
        {minimizedMode && (
          <div className="absolute inset-x-0 top-6 h-24 flex items-center justify-center px-6">
            <div className="w-full bg-white bg-opacity-30 backdrop-blur-md rounded-xl shadow-md p-3 flex items-center justify-between"
                 style={{
                   borderLeft: '1px solid rgba(255, 255, 255, 0.4)',
                   borderTop: '1px solid rgba(255, 255, 255, 0.4)',
                   borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                   borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                 }}>
              <div className="flex items-center space-x-2">
                <div className="relative h-9 w-9 flex items-center justify-center bg-white bg-opacity-80 rounded-full shadow-sm mr-3">
                  {isRecording ? (
                    <>
                      <div className="absolute inset-0 bg-red-200 rounded-full animate-ping opacity-30"></div>
                      <Pause size={16} className="text-red-500" />
                    </>
                  ) : (
                    <Mic size={16} className="text-blue-500" />
                  )}
                </div>
                <span className="text-xs text-blue-900">
                  {isRecording ? 'ضبط صدا...' : 'آماده برای ضبط'}
                </span>
              </div>
              
              <div className="flex-1 px-3 max-w-xs mx-2 overflow-hidden">
                {isRecording ? (
                  <div className="px-3 py-1.5 bg-white bg-opacity-70 rounded-lg shadow-inner w-full overflow-hidden whitespace-nowrap"
                       style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' }}>
                    <p className="text-xs text-blue-900 text-right overflow-hidden" style={{ direction: 'rtl' }}>
                      {transcript.slice(-25)}
                      <span className="inline-block w-1 h-3 mr-1 bg-blue-500 animate-blink align-middle rounded-sm"/>
                    </p>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-lg w-full">
                    <p className="text-xs text-blue-800 text-right opacity-60" style={{ direction: 'rtl' }}>
                      میکروفون را فعال کنید...
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className="p-1.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-colors shadow-sm"
                  onClick={toggleMinimizedMode}
                >
                  <Maximize2 size={14} className="text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!minimizedMode && (
          <div className="pt-14 px-6 pb-6">
            <div 
              ref={transcriptContainerRef}
              className="w-full min-h-40 max-h-64 bg-gray-50 rounded-xl p-5 mb-5 overflow-y-auto transition-colors duration-300"
              style={{
                direction: 'rtl',
                textAlign: 'right',
                boxShadow: 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.03)',
                backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(249, 250, 251, 0.95))',
                borderLeft: '1px solid rgba(229, 231, 235, 0.8)',
                borderTop: '1px solid rgba(229, 231, 235, 0.8)',
                borderRight: '1px solid rgba(229, 231, 235, 0.5)',
                borderBottom: '1px solid rgba(229, 231, 235, 0.5)'
              }}
            >
              {transcript ? (
                <div className="relative">
                  {getTextWithConfidence(transcript).map((item, idx) => (
                    <span 
                      key={idx} 
                      className={`${getConfidenceColor(item.confidence)} ${
                        typingIndex > idx * 2 ? 'opacity-100' : 'opacity-0'
                      } transition-opacity duration-300 leading-loose text-base`}
                      style={{ textShadow: '0 0.5px 0.5px rgba(0, 0, 0, 0.05)' }}
                    >
                      {item.word}{' '}
                    </span>
                  ))}
                  {isRecording && (
                    <span className="inline-block w-1.5 h-5 mr-1 bg-blue-500 animate-blink align-middle rounded-sm"/>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32">
                  <Mic size={28} className="text-gray-300 mb-3" />
                  <p className="text-gray-400 text-center" style={{ textShadow: '0 1px 1px rgba(255, 255, 255, 0.9)' }}>
                    برای شروع دکمه میکروفون را فشار دهید
                  </p>
                </div>
              )}
            </div>
            
            {transcript && (
              <div className="relative w-full mb-3">
                <button
                  onClick={toggleTranslation}
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200"
                  style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {translationOpen ? 
                      <ChevronDown size={14} className="text-white" /> : 
                      <ChevronUp size={14} className="text-white" />
                    }
                  </div>
                </button>
                
                <div 
                  className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${
                    translationOpen ? 'max-h-40 opacity-100 mb-3' : 'max-h-0 opacity-0'
                  }`}
                  style={{ boxShadow: translationOpen ? '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' : 'none' }}
                >
                  <div className="w-full bg-white rounded-xl p-4 border border-indigo-100 flex flex-col">
                    <div className="flex items-center mb-2">
                      <Globe size={14} className="text-indigo-500 mr-2" />
                      <p className="text-xs text-indigo-600 font-medium">English Translation</p>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-lg min-h-8 text-sm text-left mb-2">
                      {isTranslating ? (
                        <div className="flex items-center justify-center h-6">
                          <div className="loader"></div>
                        </div>
                      ) : translation ? (
                        translation
                      ) : (
                        <span className="text-gray-400 italic">Translation will appear here...</span>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => pasteTextAtCursor(translation)}
                        disabled={!translation}
                        className="p-1 rounded-md bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 transition-colors text-xs flex items-center"
                      >
                        <Check size={12} className="mr-1" />
                        Insert
                      </button>
                      <button
                        onClick={() => copyTranslation()}
                        disabled={!translation}
                        className="p-1 rounded-md bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 transition-colors text-xs flex items-center"
                      >
                        <Copy size={12} className="mr-1" />
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-around">
              <button 
                onClick={saveTranscript}
                disabled={!transcript.trim() || isRecording}
                className="p-3 rounded-full bg-white hover:bg-gray-100 transition-colors disabled:opacity-40 transform hover:scale-110 disabled:hover:scale-100 transition-transform duration-200 shadow-sm"
                title="ذخیره"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <Save size={20} className="text-blue-500" />
              </button>
              <button 
                onClick={copyTranscript}
                disabled={!transcript.trim()}
                className="p-3 rounded-full bg-white hover:bg-gray-100 transition-colors disabled:opacity-40 transform hover:scale-110 disabled:hover:scale-100 transition-transform duration-200 shadow-sm"
                title="کپی"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <Copy size={20} className="text-green-500" />
              </button>
              <button 
                onClick={() => pasteTextAtCursor(transcript)}
                disabled={!transcript.trim()}
                className="p-3 rounded-full bg-white hover:bg-gray-100 transition-colors disabled:opacity-40 transform hover:scale-110 disabled:hover:scale-100 transition-transform duration-200 shadow-sm"
                title="درج در محل نشانگر"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="20" 
                  height="20" 
                  stroke="currentColor" 
                  fill="none" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-purple-500"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M12 11v6"></path>
                  <path d="M9 14h6"></path>
                </svg>
              </button>
              <button 
                onClick={resetRecording}
                disabled={!transcript.trim() && !isRecording}
                className="p-3 rounded-full bg-white hover:bg-gray-100 transition-colors disabled:opacity-40 transform hover:scale-110 disabled:hover:scale-100 transition-transform duration-200 shadow-sm"
                title="پاک کردن"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}
              >
                <Trash2 size={20} className="text-red-500" />
              </button>
            </div>
          </div>
        )}
        
        {savedTranscripts.length > 0 && !minimizedMode && (
          <div className="border-t border-gray-200">
            <div className="px-6 py-4">
              <h3 className="text-sm text-gray-500 mb-3">گفتارهای ذخیره شده</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {savedTranscripts.map((item, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-white rounded-lg text-right relative group hover:bg-gray-50 transition-colors duration-300 shadow-sm"
                    style={{ direction: 'rtl' }}
                  >
                    <p className="text-sm text-gray-800">{item.text}</p>
                    {item.translation && (
                      <div className="mt-1 mb-2 p-1.5 bg-indigo-50 rounded text-xs text-left text-gray-700 border-l-2 border-indigo-300">
                        <span className="text-indigo-500 text-[10px] mr-1">[EN]</span> {item.translation}
                      </div>
                    )}
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{item.duration}</span>
                      <div>
                        <span className="ml-2">{item.date}</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                      <button 
                        onClick={() => {
                          if (item.translation) {
                            pasteTextAtCursor(item.translation);
                          }
                        }}
                        className={`p-1.5 text-indigo-500 rounded-full hover:bg-indigo-100 shadow-sm ${!item.translation ? 'hidden' : ''}`}
                        title="درج ترجمه در محل نشانگر"
                      >
                        <Globe size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          pasteTextAtCursor(item.text);
                        }}
                        className="p-1.5 bg-purple-50 text-purple-500 rounded-full hover:bg-purple-100 shadow-sm"
                        title="درج متن در محل نشانگر"
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          width="14" 
                          height="14" 
                          stroke="currentColor" 
                          fill="none" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                          <path d="M12 11v6"></path>
                          <path d="M9 14h6"></path>
                        </svg>
                      </button>
                      <button 
                        onClick={() => deleteSavedTranscript(index)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToTextUIWithTranslation;