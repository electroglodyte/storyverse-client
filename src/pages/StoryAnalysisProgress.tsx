import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

import './StoryAnalysisProgress.css';

/**
 * ULTRA ROBUST VERSION 2.2 - ENHANCED DOM MANIPULATION WITH GUARANTEED UI PRESERVATION
 * 
 * This version fixes critical issues in the extraction review process:
 * 1. Eliminates flicker by using improved direct DOM manipulation techniques
 * 2. Guarantees extraction review visibility and clickability 
 * 3. Preserves all UI elements correctly using z-index stacking context
 * 4. Prevents race conditions with delayed execution and promise-based rendering
 */

interface AnalysisData {
  storyId: string;
  storyWorldId: string;
  files: Array<{
    name: string;
    type: string;
    content: string | null;
  }>;
}

// Constants for localStorage keys
const EXTRACTION_COMPLETE_KEY = 'storyverse_extraction_complete';
const EXTRACTION_DATA_KEY = 'storyverse_extraction_data';
const EXTRACTION_SUMMARY_KEY = 'storyverse_extraction_summary';
const EXTRACTION_TIMESTAMP_KEY = 'storyverse_extraction_timestamp';
const EXTRACTION_STAGE_KEY = 'storyverse_extraction_stage';
const EXTRACTION_REVIEW_CONTAINER_ID = 'extraction-review-overlay';
const EXTRACTION_CACHE_BREAKER_KEY = 'storyverse_extraction_cache_breaker';

// StoryAnalysisProgress component - improved with persistent data management
const StoryAnalysisProgress: React.FC = () => {
  // Base state for dynamic rendering
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  const [analysisPhase, setAnalysisPhase] = useState<'extracting' | 'saving' | 'complete' | 'error' | 'extracted'>('extracting');
  const [currentFile, setCurrentFile] = useState<string>('');
  const [detectedItems, setDetectedItems] = useState<Array<{type: string; name: string; id: string}>>([]);
  const [analysisStage, setAnalysisStage] = useState<string>('Preparing text analysis...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string>('');
  const [storyWorldId, setStoryWorldId] = useState<string>('');
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState<number>(0);
  const [extractionSummary, setExtractionSummary] = useState<any>(null);
  const [saveResults, setSaveResults] = useState<any>({
    characters: 0,
    locations: 0,
    events: 0,
    scenes: 0,
    plotlines: 0,
    relationships: 0
  });
  const [extractionTimestamp, setExtractionTimestamp] = useState<string>('');
  const [extractedElements, setExtractedElements] = useState<any>(null);
  const [extractionStarted, setExtractionStarted] = useState<boolean>(false);
  const [fullErrorDetails, setFullErrorDetails] = useState<string | null>(null);
  const [savedEntityIds, setSavedEntityIds] = useState<{[key: string]: string[]}>({
    characters: [],
    locations: [],
    events: [],
    scenes: [],
    plotlines: []
  });
  const [forceNewExtraction, setForceNewExtraction] = useState<boolean>(false);
  
  // CRITICAL: This is an independent state variable that ONLY can be set to true
  // and will ONLY be cleared on explicit user action. This ensures we don't lose the
  // extraction complete state in React's render cycle.
  const [mustShowExtractionReview, setMustShowExtractionReview] = useState<boolean>(
    localStorage.getItem(EXTRACTION_COMPLETE_KEY) === 'true'
  );
  
  // Use refs to store critical data to prevent loss during re-renders
  const analysisDataRef = useRef<AnalysisData | null>(null);
  const logHistoryRef = useRef<string[]>([]);
  const extractedElementsRef = useRef<any>(null);
  const saveRetryCountRef = useRef<{[key: string]: number}>({
    characters: 0,
    locations: 0,
    events: 0,
    scenes: 0,
    plotlines: 0
  });
  const MAX_SAVE_RETRIES = 3;
  // Ref to force extraction review screen
  const forceExtractionReviewRef = useRef<boolean>(true);
  // Track if extraction is complete
  const extractionCompleteRef = useRef<boolean>(false);
  // Timer ref to prevent memory leaks
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to store click handler functions for DOM elements
  const handlerFunctionsRef = useRef<{
    continueToSave: (() => void) | null,
    forceNewExtraction: (() => void) | null
  }>({
    continueToSave: null,
    forceNewExtraction: null
  });
  // Ref for counting overlay creation attempts
  const overlayAttemptCountRef = useRef<number>(0);
  const MAX_OVERLAY_ATTEMPTS = 5;
  // Animation progress for forced delay
  const [extractionProgress, setExtractionProgress] = useState<number>(0);
  // Ref to track forced new extraction status
  const isNewExtractionRef = useRef<boolean>(false);
  // Store the original body and sidebar elements
  const originalBodyStyleRef = useRef<string>('');
  const originalSidebarDisplayRef = useRef<string>('');
  // Track if extraction review is currently showing
  const isExtractionReviewShowingRef = useRef<boolean>(false);
  // Ref to store the timestamp of the last DOM check
  const lastDomCheckRef = useRef<number>(0);
  
  const navigate = useNavigate();

  // Enhanced logger with timestamp and state backup
  const logDebug = (message: string, data?: any) => {
    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}`;
      console.log(logMessage);
      
      // Store in history ref
      logHistoryRef.current.push(logMessage);
      
      if (data) {
        console.log(data);
        // For critical data, stringify it and add to history
        if (data.storyId || data.storyWorldId || data.files || data.characters || data.locations) {
          try {
            const dataStr = JSON.stringify(data, null, 2).substring(0, 500) + (JSON.stringify(data).length > 500 ? '...' : '');
            logHistoryRef.current.push(`[${timestamp}] DATA: ${dataStr}`);
          } catch (err) {
            logHistoryRef.current.push(`[${timestamp}] DATA: [Too complex to stringify]`);
          }
        }
      }
      
      // Update debug info in UI - show last 20 log entries
      setDebugInfo(logHistoryRef.current.slice(-20).join('\n'));
    } catch (err) {
      console.error("Error in logDebug:", err);
    }
  };

  // ULTRA ROBUST VERSION: Refined DOM-based approach for extraction review screen
  // Improved with guaranteed CSS rendering and element visibility
  const showExtractionReviewScreen = async () => {
    logDebug("*** SHOWING EXTRACTION REVIEW SCREEN WITH ULTRA ROBUST DOM APPROACH ***");
    
    // Check if we've recently tried this to avoid rapid re-renders
    const now = Date.now();
    if (now - lastDomCheckRef.current < 500) {
      logDebug("Skipping showExtractionReviewScreen - called too frequently");
      return;
    }
    lastDomCheckRef.current = now;
    
    // Mark that we're attempting to show the extraction review
    isExtractionReviewShowingRef.current = true;
    
    // Safety: increment attempt counter
    overlayAttemptCountRef.current += 1;
    
    // First, make sure we have summary data
    if (!extractionSummary && localStorage.getItem(EXTRACTION_SUMMARY_KEY)) {
      try {
        const savedSummary = JSON.parse(localStorage.getItem(EXTRACTION_SUMMARY_KEY) || '{}');
        setExtractionSummary(savedSummary);
      } catch (err) {
        logDebug("Error parsing extraction summary:", err);
      }
    }
    
    // Get timestamp if available
    const timestamp = extractionTimestamp || 
                      localStorage.getItem(EXTRACTION_TIMESTAMP_KEY) || 
                      new Date().toISOString();
    
    try {
      // Remove any existing overlay to prevent duplicates
      const existingOverlay = document.getElementById(EXTRACTION_REVIEW_CONTAINER_ID);
      if (existingOverlay) {
        try {
          existingOverlay.remove();
          logDebug("Removed existing overlay before creating new one");
        } catch (err) {
          logDebug("Error removing existing overlay:", err);
        }
      }
      
      // IMPORTANT: Store original body style
      if (!originalBodyStyleRef.current) {
        const bodyStyle = document.body.style.cssText;
        originalBodyStyleRef.current = bodyStyle;
        logDebug("Stored original body style:", bodyStyle);
      }
      
      // Store original sidebar display state if it exists
      const sidebarElement = document.querySelector('.sidebar, .side-nav, #sidebar, nav.sidebar, .nav-sidebar');
      if (sidebarElement && !originalSidebarDisplayRef.current) {
        const computedStyle = window.getComputedStyle(sidebarElement);
        originalSidebarDisplayRef.current = computedStyle.display;
        logDebug("Stored original sidebar display:", originalSidebarDisplayRef.current);
      }
      
      // Create a new overlay container
      const overlayContainer = document.createElement('div');
      overlayContainer.id = EXTRACTION_REVIEW_CONTAINER_ID;
      overlayContainer.className = 'extraction-review-overlay';
      
      // Set critical styles directly on the element to guarantee visibility
      // Using important flags for all critical properties
      Object.assign(overlayContainer.style, {
        position: 'fixed !important',
        top: '0 !important',
        left: '0 !important',
        right: '0 !important',
        bottom: '0 !important',
        backgroundColor: 'rgba(255, 255, 255, 0.98) !important',
        zIndex: '1000000 !important', // Ultra high z-index
        display: 'flex !important',
        justifyContent: 'center !important',
        alignItems: 'flex-start !important',
        overflowY: 'auto !important',
        padding: '20px !important',
        transform: 'translateZ(0) !important', // Force hardware acceleration
        backfaceVisibility: 'hidden !important', // Additional performance improvement
        willChange: 'transform !important', // Signal to browser to optimize
        transition: 'none !important', // Disable transitions to prevent flicker
      });
      
      // Add inline !important to every style
      for (const key in overlayContainer.style) {
        if (typeof overlayContainer.style[key] === 'string' && overlayContainer.style[key] && !overlayContainer.style[key].includes('!important')) {
          overlayContainer.style[key] = `${overlayContainer.style[key]} !important`;
        }
      }
      
      // Generate HTML for the extraction review
      const summaryItems = extractionSummary || 
                          JSON.parse(localStorage.getItem(EXTRACTION_SUMMARY_KEY) || 
                          '{\"characters\":0,\"locations\":0,\"events\":0,\"scenes\":0,\"plotlines\":0,\"relationships\":0}');
      
      // Create the HTML content with inlined styles for maximum reliability
      const htmlContent = `
        <div class="extraction-review-content" style="width:100% !important;max-width:800px !important;margin:0 auto !important;padding:20px !important;background-color:white !important;border-radius:8px !important;box-shadow:0 4px 12px rgba(0,0,0,0.1) !important;position:relative !important;z-index:1000001 !important;">
          <div class="analysis-progress-container" style="text-align:center !important;">
            <h1 style="margin-bottom:20px !important;color:#333 !important;font-size:28px !important;">Analyzing Story</h1>
            <div class="extraction-complete" style="padding:20px !important;">
              <div class="success-icon" style="margin:0 auto 20px !important;width:60px !important;height:60px !important;background-color:#4CAF50 !important;color:white !important;border-radius:50% !important;display:flex !important;align-items:center !important;justify-content:center !important;font-size:32px !important;">✓</div>
              <h2 style="margin-bottom:10px !important;color:#333 !important;font-size:24px !important;">Extraction Complete!</h2>
              <p style="margin-bottom:20px !important;color:#555 !important;font-size:16px !important;">The narrative elements have been successfully extracted. Ready to save to database.</p>
              
              <div class="extraction-summary" style="margin-bottom:30px !important;">
                <div class="summary" style="display:flex !important;flex-wrap:wrap !important;justify-content:center !important;gap:20px !important;margin-bottom:20px !important;">
                  <div class="summary-item" style="padding:15px !important;background-color:#f8f9fa !important;border-radius:8px !important;min-width:120px !important;text-align:center !important;">
                    <h3 style="margin-bottom:5px !important;font-size:16px !important;color:#555 !important;">Characters</h3>
                    <span class="count" style="font-size:24px !important;font-weight:bold !important;color:#2196F3 !important;">${summaryItems.characters || 0}</span>
                  </div>
                  <div class="summary-item" style="padding:15px !important;background-color:#f8f9fa !important;border-radius:8px !important;min-width:120px !important;text-align:center !important;">
                    <h3 style="margin-bottom:5px !important;font-size:16px !important;color:#555 !important;">Locations</h3>
                    <span class="count" style="font-size:24px !important;font-weight:bold !important;color:#9C27B0 !important;">${summaryItems.locations || 0}</span>
                  </div>
                  <div class="summary-item" style="padding:15px !important;background-color:#f8f9fa !important;border-radius:8px !important;min-width:120px !important;text-align:center !important;">
                    <h3 style="margin-bottom:5px !important;font-size:16px !important;color:#555 !important;">Events</h3>
                    <span class="count" style="font-size:24px !important;font-weight:bold !important;color:#FF9800 !important;">${summaryItems.events || 0}</span>
                  </div>
                  <div class="summary-item" style="padding:15px !important;background-color:#f8f9fa !important;border-radius:8px !important;min-width:120px !important;text-align:center !important;">
                    <h3 style="margin-bottom:5px !important;font-size:16px !important;color:#555 !important;">Scenes</h3>
                    <span class="count" style="font-size:24px !important;font-weight:bold !important;color:#607D8B !important;">${summaryItems.scenes || 0}</span>
                  </div>
                  <div class="summary-item" style="padding:15px !important;background-color:#f8f9fa !important;border-radius:8px !important;min-width:120px !important;text-align:center !important;">
                    <h3 style="margin-bottom:5px !important;font-size:16px !important;color:#555 !important;">Plotlines</h3>
                    <span class="count" style="font-size:24px !important;font-weight:bold !important;color:#E91E63 !important;">${summaryItems.plotlines || 0}</span>
                  </div>
                </div>
                
                <div class="extraction-timestamp" style="text-align:center !important;font-size:14px !important;color:#777 !important;margin-bottom:15px !important;">
                  Extracted at: ${new Date(timestamp).toLocaleString()}
                </div>
                
                ${debugInfo ? `
                  <div class="debug-info" style="margin-top:20px !important;padding:15px !important;background-color:#f5f5f5 !important;border-radius:4px !important;font-size:12px !important;max-height:200px !important;overflow-y:auto !important;text-align:left !important;">
                    <h3 style="margin-bottom:5px !important;font-size:14px !important;color:#555 !important;">Debug Information</h3>
                    <pre style="white-space:pre-wrap !important;margin:0 !important;font-family:monospace !important;">${debugInfo}</pre>
                  </div>
                ` : ''}
              </div>
              
              <div class="actions-container" style="display:flex !important;justify-content:center !important;gap:15px !important;margin-top:30px !important;position:relative !important;z-index:1000002 !important;">
                <button id="continue-to-save-btn" style="padding:12px 24px !important;background-color:#2196F3 !important;color:white !important;border:none !important;border-radius:4px !important;font-size:16px !important;cursor:pointer !important;font-weight:bold !important;position:relative !important;z-index:1000003 !important;">
                  Continue to Save Elements
                </button>
                <button id="force-new-extraction-btn" style="padding:12px 24px !important;background-color:#F5F5F5 !important;color:#333 !important;border:1px solid #DDD !important;border-radius:4px !important;font-size:16px !important;cursor:pointer !important;position:relative !important;z-index:1000003 !important;">
                  Force New Extraction
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Set the HTML content
      overlayContainer.innerHTML = htmlContent;
      
      // Append to document
      document.body.appendChild(overlayContainer);
      
      // CRITICAL: Add an inline stylesheet with !important rules to guarantee styles are applied
      const styleId = 'extraction-review-critical-style';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.innerHTML = `
          #${EXTRACTION_REVIEW_CONTAINER_ID} {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background-color: rgba(255, 255, 255, 0.98) !important;
            z-index: 1000000 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            overflow-y: auto !important;
            padding: 20px !important;
            transform: translateZ(0) !important;
            backface-visibility: hidden !important;
            will-change: transform !important;
            transition: none !important;
          }
          
          #${EXTRACTION_REVIEW_CONTAINER_ID} button {
            cursor: pointer !important;
            position: relative !important;
            z-index: 1000003 !important;
            transform: translateZ(0) !important;
          }
          
          #${EXTRACTION_REVIEW_CONTAINER_ID} #continue-to-save-btn:hover {
            background-color: #1976D2 !important;
          }
          
          #${EXTRACTION_REVIEW_CONTAINER_ID} #force-new-extraction-btn:hover {
            background-color: #E0E0E0 !important;
          }
          
          /* Ensure proper z-index */
          .sidebar, .side-nav, .navbar, .nav-header {
            z-index: 1 !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
      
      // RESTORE VISIBILITY: Ensure sidebar and navigation elements are still visible
      await restoreOriginalUIElements();
      
      // Define the event handler functions
      const handleContinueClick = () => {
        logDebug("Continue button clicked via direct DOM event handler");
        // Use the stored callback functions from the ref
        if (handlerFunctionsRef.current.continueToSave) {
          handlerFunctionsRef.current.continueToSave();
        } else {
          logDebug("WARNING: Continue handler function is null!");
          // Fallback action
          localStorage.removeItem(EXTRACTION_COMPLETE_KEY);
          setMustShowExtractionReview(false);
          setAnalysisPhase('saving');
          setIsAnalyzing(true);
          // Try to hide the overlay
          try {
            overlayContainer.style.display = 'none';
          } catch (err) {
            logDebug("Error hiding overlay:", err);
          }
        }
      };
      
      const handleNewExtractionClick = () => {
        logDebug("Force new extraction button clicked via direct DOM event handler");
        // Use the stored callback function from the ref
        if (handlerFunctionsRef.current.forceNewExtraction) {
          handlerFunctionsRef.current.forceNewExtraction();
        } else {
          logDebug("WARNING: Force new extraction handler function is null!");
          // Fallback action - reload the page
          window.location.reload();
        }
      };
      
      // Add event listeners with a slight delay to ensure the DOM is ready
      setTimeout(() => {
        try {
          const continueBtn = document.getElementById('continue-to-save-btn');
          const resetBtn = document.getElementById('force-new-extraction-btn');
          
          if (continueBtn) {
            // Remove existing listeners if any
            const newContinueBtn = continueBtn.cloneNode(true);
            if (continueBtn.parentNode) {
              continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
            }
            // Add the new listener
            newContinueBtn.addEventListener('click', handleContinueClick);
            logDebug("Successfully attached continue button event listener");
          } else {
            logDebug("WARNING: Could not find continue button in DOM");
          }
          
          if (resetBtn) {
            // Remove existing listeners if any
            const newResetBtn = resetBtn.cloneNode(true);
            if (resetBtn.parentNode) {
              resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            }
            // Add the new listener
            newResetBtn.addEventListener('click', handleNewExtractionClick);
            logDebug("Successfully attached reset button event listener");
          } else {
            logDebug("WARNING: Could not find reset button in DOM");
          }
        } catch (err) {
          logDebug("Error attaching event listeners to extraction review buttons:", err);
        }
      }, 50);
      
      // Make sure the overlay is visible
      try {
        overlayContainer.style.display = 'flex';
        
        // Force reflow to ensure the browser renders the overlay
        void overlayContainer.offsetHeight;
        
        logDebug("Extraction review overlay displayed directly in DOM");
      } catch (err) {
        logDebug("Error displaying overlay:", err);
      }
      
      // Double-check to make sure overlay exists and is visible after a delay
      setTimeout(() => {
        const overlayCheck = document.getElementById(EXTRACTION_REVIEW_CONTAINER_ID);
        if (!overlayCheck) {
          logDebug("WARNING: Overlay not found after creation delay, retrying...");
          
          // Try again if we haven't reached maximum attempts
          if (overlayAttemptCountRef.current < MAX_OVERLAY_ATTEMPTS) {
            showExtractionReviewScreen();
          } else {
            logDebug("ERROR: Maximum overlay creation attempts reached");
          }
        } else if (overlayCheck.style.display !== 'flex') {
          logDebug("WARNING: Overlay exists but is not visible, fixing...");
          overlayCheck.style.display = 'flex !important';
        }
        
        // Ensure UI elements are still visible
        restoreOriginalUIElements();
      }, 200);
      
      // Set up a recurring check (every 2 seconds) to ensure the overlay stays visible
      // and the buttons remain clickable
      const intervalId = setInterval(() => {
        if (!isExtractionReviewShowingRef.current) {
          clearInterval(intervalId);
          return;
        }
        
        const overlayCheck = document.getElementById(EXTRACTION_REVIEW_CONTAINER_ID);
        if (!overlayCheck) {
          logDebug("WARNING: Overlay disappeared, recreating...");
          if (overlayAttemptCountRef.current < MAX_OVERLAY_ATTEMPTS) {
            showExtractionReviewScreen();
          }
        } else {
          // Make sure buttons are properly attached with listeners
          const continueBtn = document.getElementById('continue-to-save-btn');
          const resetBtn = document.getElementById('force-new-extraction-btn');
          
          if (!continueBtn || !resetBtn) {
            logDebug("WARNING: Buttons missing from overlay, reattaching...");
            // Refresh internal HTML to recreate buttons
            overlayCheck.innerHTML = htmlContent;
            
            setTimeout(() => {
              try {
                const newContinueBtn = document.getElementById('continue-to-save-btn');
                const newResetBtn = document.getElementById('force-new-extraction-btn');
                
                if (newContinueBtn) {
                  newContinueBtn.addEventListener('click', handleContinueClick);
                }
                
                if (newResetBtn) {
                  newResetBtn.addEventListener('click', handleNewExtractionClick);
                }
                
                logDebug("Reattached button event listeners");
              } catch (err) {
                logDebug("Error reattaching button listeners:", err);
              }
            }, 50);
          }
        }
        
        // Ensure UI elements are still visible
        restoreOriginalUIElements();
      }, 2000);
      
      // Clean up interval after 2 minutes (120000ms)
      setTimeout(() => {
        clearInterval(intervalId);
      }, 120000);
    } catch (err) {
      logDebug("Error showing extraction review screen:", err);
      
      // Last resort fallback - try to show a minimal, reliable extraction review
      try {
        const fallbackDiv = document.createElement('div');
        fallbackDiv.style.cssText = "position:fixed !important; top:0 !important; left:0 !important; right:0 !important; bottom:0 !important; background:white !important; z-index:9999999 !important; display:flex !important; flex-direction:column !important; justify-content:center !important; align-items:center !important; padding:20px !important;";
        fallbackDiv.innerHTML = `
          <h1 style="margin-bottom:20px !important;">Extraction Complete</h1>
          <p style="margin-bottom:20px !important;">Ready to save ${summaryItems.characters || 0} characters, ${summaryItems.locations || 0} locations, and more.</p>
          <div style="display:flex !important; gap:20px !important;">
            <button id="fallback-continue" style="padding:10px 20px !important; background:#2196F3 !important; color:white !important; border:none !important; cursor:pointer !important;">Continue to Save</button>
            <button id="fallback-retry" style="padding:10px 20px !important; background:#f5f5f5 !important; color:#333 !important; border:1px solid #ddd !important; cursor:pointer !important;">Force New Extraction</button>
          </div>
        `;
        document.body.appendChild(fallbackDiv);
        
        document.getElementById('fallback-continue')?.addEventListener('click', () => {
          if (handlerFunctionsRef.current.continueToSave) {
            handlerFunctionsRef.current.continueToSave();
          } else {
            localStorage.removeItem(EXTRACTION_COMPLETE_KEY);
            setMustShowExtractionReview(false);
            setAnalysisPhase('saving');
            window.location.reload();
          }
        });
        
        document.getElementById('fallback-retry')?.addEventListener('click', () => {
          if (handlerFunctionsRef.current.forceNewExtraction) {
            handlerFunctionsRef.current.forceNewExtraction();
          } else {
            window.location.reload();
          }
        });
      } catch (fallbackErr) {
        logDebug("Fallback extraction review also failed:", fallbackErr);
      }
    }
  };
  
  // Hide the extraction review overlay
  const hideExtractionReviewScreen = () => {
    try {
      // Mark that the extraction review screen is no longer showing
      isExtractionReviewShowingRef.current = false;
      
      const overlayContainer = document.getElementById(EXTRACTION_REVIEW_CONTAINER_ID);
      if (overlayContainer) {
        // First try to hide it
        overlayContainer.style.display = 'none';
        
        // Then try to remove it completely
        try {
          overlayContainer.remove();
        } catch (removeErr) {
          logDebug("Error removing overlay, fallback to hiding:", removeErr);
        }
        
        // Restore original UI elements
        restoreOriginalUIElements();
        
        logDebug("Successfully hid extraction review overlay");
      }
      
      // Also remove critical style if present
      const styleElement = document.getElementById('extraction-review-critical-style');
      if (styleElement) {
        try {
          styleElement.remove();
        } catch (err) {
          logDebug("Error removing style element:", err);
        }
      }
    } catch (err) {
      logDebug("Error in hideExtractionReviewScreen:", err);
    }
  };
  
  // Restore visibility of UI elements that may have been affected
  const restoreOriginalUIElements = async () => {
    try {
      // Restore original body style if we stored it
      if (originalBodyStyleRef.current) {
        document.body.style.cssText = originalBodyStyleRef.current;
      }
      
      // Find and restore sidebar display if it exists
      const sidebarElements = document.querySelectorAll('.sidebar, .side-nav, #sidebar, nav.sidebar, .nav-sidebar');
      if (sidebarElements.length > 0 && originalSidebarDisplayRef.current) {
        sidebarElements.forEach(sidebar => {
          (sidebar as HTMLElement).style.display = originalSidebarDisplayRef.current;
          (sidebar as HTMLElement).style.visibility = 'visible';
          (sidebar as HTMLElement).style.opacity = '1';
        });
      }
      
      // Find and restore other navigation elements
      const navElements = document.querySelectorAll('header, nav, .navbar, .nav-header, .top-bar, .app-header');
      navElements.forEach(nav => {
        (nav as HTMLElement).style.visibility = 'visible';
        (nav as HTMLElement).style.display = '';
        (nav as HTMLElement).style.opacity = '1';
      });
      
      // Make sure any other similar elements are visible
      document.querySelectorAll('.layout-container, .main-content, .content-area').forEach(element => {
        (element as HTMLElement).style.visibility = 'visible';
        (element as HTMLElement).style.opacity = '1';
      });
      
      logDebug("Restored visibility of UI elements");
    } catch (err) {
      logDebug("Error restoring UI elements:", err);
    }
  };

  // Function to forcibly set the component to extraction review mode
  const forceExtractionReviewScreen = () => {
    logDebug("*** FORCING EXTRACTION REVIEW SCREEN ***");
    
    // First clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set persistent flag in localStorage
    localStorage.setItem(EXTRACTION_COMPLETE_KEY, 'true');
    
    // Set our dedicated state variable to true
    setMustShowExtractionReview(true);
    
    // Update all relevant state and refs
    setAnalysisPhase('extracted');
    setIsAnalyzing(false);
    extractionCompleteRef.current = true;
    forceExtractionReviewRef.current = true;
    
    // Reset overlay attempt counter
    overlayAttemptCountRef.current = 0;
    
    // DIRECT DOM MANIPULATION: Show extraction review
    showExtractionReviewScreen();
    
    // Schedule this again in 250ms to ensure it sticks
    timerRef.current = setTimeout(() => {
      logDebug("*** REINFORCING EXTRACTION REVIEW MODE (delayed) ***");
      setAnalysisPhase('extracted');
      setIsAnalyzing(false);
      setMustShowExtractionReview(true);
      
      // Show again to ensure it's visible
      showExtractionReviewScreen();
      
      // Ensure UI elements are properly visible
      restoreOriginalUIElements();
    }, 250);
  };
  
  // Improved analysis data access with multiple backups
  const getAnalysisData = (): AnalysisData | null => {
    try {
      // First try from ref (primary source after initial load)
      if (analysisDataRef.current) {
        logDebug("Getting analysis data from ref");
        return analysisDataRef.current;
      }
      
      // Then try from session storage (primary source on initial load)
      const analysisDataStr = sessionStorage.getItem('analysisData');
      if (analysisDataStr) {
        logDebug("Getting analysis data from sessionStorage");
        try {
          const parsedData = JSON.parse(analysisDataStr);
          
          // Validate required fields
          if (!parsedData.storyId || !parsedData.storyWorldId) {
            logDebug("Analysis data missing required fields", parsedData);
            return null;
          }
          
          // Store in ref for future access
          analysisDataRef.current = parsedData;
          return parsedData;
        } catch (err) {
          logDebug("Error parsing analysis data from session storage:", err);
          return null;
        }
      }
      
      // Try to recover from localStorage as a backup
      const backupAnalysisDataStr = localStorage.getItem('analysisDataBackup');
      if (backupAnalysisDataStr) {
        logDebug("Attempting to recover analysis data from localStorage backup");
        try {
          const parsedData = JSON.parse(backupAnalysisDataStr);
          if (parsedData.storyId && parsedData.storyWorldId) {
            // Restore to sessionStorage
            sessionStorage.setItem('analysisData', backupAnalysisDataStr);
            analysisDataRef.current = parsedData;
            return parsedData;
          }
        } catch (err) {
          logDebug("Error parsing backup analysis data:", err);
        }
      }
      
      // Fallback: Try to recreate from component state
      if (storyId && storyWorldId) {
        logDebug("Recreating analysis data from component state");
        const reconstructedData: AnalysisData = {
          storyId,
          storyWorldId,
          files: [{
            name: currentFile || 'unknown.txt',
            type: 'text/plain',
            content: null
          }]
        };
        
        // Store for future use
        analysisDataRef.current = reconstructedData;
        sessionStorage.setItem('analysisData', JSON.stringify(reconstructedData));
        localStorage.setItem('analysisDataBackup', JSON.stringify(reconstructedData));
        
        return reconstructedData;
      }
      
      logDebug("Could not retrieve analysis data from any source");
      return null;
    } catch (err) {
      logDebug("Unexpected error in getAnalysisData:", err);
      return null;
    }
  };
  
  // Forced delay simulation to prevent instant extraction
  const simulateProcessingDelay = async (targetTimeMs: number = 3000) => {
    logDebug(`Simulating processing delay of ${targetTimeMs}ms...`);
    
    const startTime = Date.now();
    const updateInterval = 50; // 50ms updates
    let elapsed = 0;
    
    // Reset progress
    setExtractionProgress(0);
    
    return new Promise<void>((resolve) => {
      const updateProgress = () => {
        elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / targetTimeMs) * 100, 99);
        setExtractionProgress(progress);
        
        if (elapsed < targetTimeMs) {
          setTimeout(updateProgress, updateInterval);
        } else {
          setExtractionProgress(100);
          setTimeout(() => resolve(), 200); // Small additional delay for final 100%
        }
      };
      
      updateProgress();
    });
  };
  
  // Clear local storage cache for extraction
  const clearAnalysisCache = () => {
    // Set a new cache breaker value
    const cacheBreaker = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(EXTRACTION_CACHE_BREAKER_KEY, cacheBreaker);
    
    // Clear extraction-related data
    localStorage.removeItem(EXTRACTION_COMPLETE_KEY);
    localStorage.removeItem(EXTRACTION_DATA_KEY);
    localStorage.removeItem(EXTRACTION_SUMMARY_KEY);
    localStorage.removeItem(EXTRACTION_TIMESTAMP_KEY);
    
    logDebug(`Cleared analysis cache with breaker: ${cacheBreaker}`);
    
    // Return the cache breaker in case we need it
    return cacheBreaker;
  };

  // Check for extraction complete status on component mount
  useEffect(() => {
    // IMPORTANT: Store the handler functions in refs so they can be accessed by direct DOM event handlers
    handlerFunctionsRef.current = {
      continueToSave: handleContinueToSaving,
      forceNewExtraction: handleFreshExtraction
    };
    
    // Skip all this if we're doing a forced new extraction
    if (isNewExtractionRef.current) {
      logDebug("Component mount - skipping cached extraction check due to forced new extraction");
      return;
    }
    
    // Check if extraction was previously completed
    const wasExtractionComplete = localStorage.getItem(EXTRACTION_COMPLETE_KEY) === 'true';
    const extractionDataStr = localStorage.getItem(EXTRACTION_DATA_KEY);
    const extractionSummaryStr = localStorage.getItem(EXTRACTION_SUMMARY_KEY);
    const extractionTimestampStr = localStorage.getItem(EXTRACTION_TIMESTAMP_KEY);
    
    logDebug(`Component mount - extraction complete: ${wasExtractionComplete}`);
    
    if (wasExtractionComplete) {
      logDebug("Found extraction complete flag in localStorage, forcing review screen");
      setMustShowExtractionReview(true);
      
      if (extractionDataStr) {
        try {
          logDebug("Restoring from previous extraction completion state");
          const extractionData = JSON.parse(extractionDataStr);
          
          // Restore the UI state to show extraction review
          setExtractedElements(extractionData);
          extractedElementsRef.current = extractionData;
          extractionCompleteRef.current = true;
          setAnalysisPhase('extracted');
          setIsAnalyzing(false);
          
          // Set the extraction summary if available
          let summary;
          if (extractionSummaryStr) {
            summary = JSON.parse(extractionSummaryStr);
            setExtractionSummary(summary);
          } else {
            // Create summary from extraction data
            summary = {
              characters: extractionData.characters?.length || 0,
              locations: extractionData.locations?.length || 0,
              events: extractionData.events?.length || 0,
              scenes: extractionData.scenes?.length || 0,
              plotlines: extractionData.plotlines?.length || 0,
              relationships: extractionData.characterRelationships?.length || 0
            };
            setExtractionSummary(summary);
          }
          
          // Set timestamp
          const timestamp = extractionTimestampStr || new Date().toISOString();
          setExtractionTimestamp(timestamp);
          
          // Reset overlay attempt counter
          overlayAttemptCountRef.current = 0;
          
          // Store the original UI state before we manipulate DOM
          storeOriginalUIState();
          
          // DIRECT DOM APPROACH: Show extraction review screen
          setTimeout(() => {
            showExtractionReviewScreen();
          }, 150);
          
          logDebug("Successfully restored extraction complete state");
        } catch (err) {
          logDebug("Error restoring extraction state:", err);
          // Don't clear the flags - we still want to show the review screen
          // but we'll need to re-extract the data
          
          // Try to show the extraction review screen anyway
          setTimeout(() => {
            showExtractionReviewScreen();
          }, 150);
        }
      }
    } else {
      // Reset flags on component mount
      forceExtractionReviewRef.current = true;
      extractionCompleteRef.current = false;
      setMustShowExtractionReview(false);
      
      // Hide the extraction review screen if visible
      hideExtractionReviewScreen();
    }
    
    // Add custom CSS to ensure overlay is visible with !important
    const style = document.createElement('style');
    style.id = 'extraction-review-style';
    style.textContent = `
      .extraction-review-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background-color: rgba(255, 255, 255, 0.97) !important;
        z-index: 1000000 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
        overflow-y: auto !important;
        transform: translateZ(0) !important;
        will-change: transform !important;
      }
      
      #extraction-review-overlay {
        position: fixed !important;
        z-index: 1000000 !important;
        display: flex !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background-color: #fff !important;
      }
      
      #continue-to-save-btn:hover {
        background-color: #1976D2 !important;
      }
      
      #force-new-extraction-btn:hover {
        background-color: #E0E0E0 !important;
      }
      
      /* Fix for any UI elements that might be hidden */
      body.has-extraction-overlay .sidebar,
      body.has-extraction-overlay .side-nav,
      body.has-extraction-overlay nav,
      body.has-extraction-overlay header {
        visibility: visible !important;
        display: block !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Clean up timers and DOM elements on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Remove the extraction review screen
      hideExtractionReviewScreen();
      
      // Remove the custom style
      const styleElement = document.getElementById('extraction-review-style');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  
  // Store original UI state before we manipulate DOM
  const storeOriginalUIState = () => {
    try {
      // Store original body style
      originalBodyStyleRef.current = document.body.style.cssText || '';
      
      // Try to find sidebar elements
      const sidebarElement = document.querySelector('.sidebar, .side-nav, #sidebar, nav.sidebar, .nav-sidebar');
      if (sidebarElement) {
        const computedStyle = window.getComputedStyle(sidebarElement);
        originalSidebarDisplayRef.current = computedStyle.display || 'block';
      }
      
      logDebug("Stored original UI state:", {
        bodyStyle: originalBodyStyleRef.current,
        sidebarDisplay: originalSidebarDisplayRef.current
      });
    } catch (err) {
      logDebug("Error storing original UI state:", err);
    }
  };

  // Component initialization and data recovery
  useEffect(() => {
    try {
      // Store original UI state on component mount
      storeOriginalUIState();
      
      // Try to get analysis data
      const analysisDataStr = sessionStorage.getItem('analysisData');
      
      if (analysisDataStr) {
        logDebug("Found analysis data in sessionStorage on mount");
        try {
          const parsedData = JSON.parse(analysisDataStr);
          analysisDataRef.current = parsedData;
          
          // Create a backup in localStorage
          localStorage.setItem('analysisDataBackup', analysisDataStr);
          
          // Set component state from this data
          if (parsedData.storyId) setStoryId(parsedData.storyId);
          if (parsedData.storyWorldId) setStoryWorldId(parsedData.storyWorldId);
          if (parsedData.files && parsedData.files[0]) {
            setCurrentFile(parsedData.files[0].name || '');
          }
          
          logDebug("Initialized component state from sessionStorage", parsedData);
        } catch (err) {
          logDebug("Error parsing analysis data on mount:", err);
        }
      } else {
        logDebug("WARNING: No analysis data found in sessionStorage on mount!");
        
        // Try to recover from localStorage backup
        const backupAnalysisDataStr = localStorage.getItem('analysisDataBackup');
        if (backupAnalysisDataStr) {
          logDebug("Attempting to recover from localStorage backup");
          try {
            const parsedData = JSON.parse(backupAnalysisDataStr);
            if (parsedData.storyId && parsedData.storyWorldId) {
              // Restore to sessionStorage
              sessionStorage.setItem('analysisData', backupAnalysisDataStr);
              analysisDataRef.current = parsedData;
              
              // Set component state
              setStoryId(parsedData.storyId);
              setStoryWorldId(parsedData.storyWorldId);
              if (parsedData.files && parsedData.files[0]) {
                setCurrentFile(parsedData.files[0].name || '');
              }
              
              logDebug("Successfully recovered analysis data from backup", parsedData);
            }
          } catch (err) {
            logDebug("Error recovering from backup:", err);
          }
        }
      }
    } catch (err) {
      logDebug("Unexpected error during initialization:", err);
    }
    
    // Cleanup function to ensure we don't keep stale data
    return () => {
      // If we're navigating away after a successful completion, we can clear the backup
      if (analysisPhase === 'complete') {
        localStorage.removeItem('analysisDataBackup');
        localStorage.removeItem(EXTRACTION_COMPLETE_KEY);
        localStorage.removeItem(EXTRACTION_DATA_KEY);
        localStorage.removeItem(EXTRACTION_SUMMARY_KEY);
        localStorage.removeItem(EXTRACTION_TIMESTAMP_KEY);
        localStorage.removeItem(EXTRACTION_STAGE_KEY);
        logDebug("Cleared analysis data backup after successful completion");
      }
    };
  }, [analysisPhase]);

  // Improved text analysis with better error handling and timeout management
  const analyzeText = async (analysisData: AnalysisData) => {
    try {
      logDebug("Beginning text analysis with fresh state");
      setAnalysisStage('Extracting narrative elements from text...');
      localStorage.setItem(EXTRACTION_STAGE_KEY, 'Extracting narrative elements from text...');
      
      const file = analysisData.files[0];
      
      if (!file || !file.content) {
        throw new Error('No file content found for analysis');
      }
      
      // Generate a unique request ID with cache breaker to ensure we're not getting cached results
      const cacheBreaker = localStorage.getItem(EXTRACTION_CACHE_BREAKER_KEY) || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${cacheBreaker}`;
      
      logDebug(`Calling analyze-story edge function with request ID: ${requestId}`);
      await addDetectedItem('System', `Analyzing ${file.name} text...`);
      
      // FORCED DELAY: Simulate some processing time for better UX
      // This ensures the user sees some progress and prevents instant extraction appearing to be cached
      await simulateProcessingDelay(5000); // 5 second minimum processing time
      
      // Setup timeout handling
      const TIMEOUT_MS = 60000; // 60 seconds
      let timeoutId: NodeJS.Timeout;
      
      // Create a promise that will reject after the timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Analysis timed out. The story may be too large to process in one go.'));
        }, TIMEOUT_MS);
      });
      
      // Create the actual analysis promise
      logDebug("Invoking analyze-story edge function with:", {
        story_title: file.name.replace(/\.[^/.]+$/, ""),
        story_world_id: analysisData.storyWorldId,
        story_id: analysisData.storyId,
        content_length: file.content.length,
        cache_breaker: cacheBreaker
      });
      
      const analysisPromise = supabase.functions.invoke('analyze-story', {
        body: {
          story_text: file.content,
          story_title: file.name.replace(/\.[^/.]+$/, ""),
          story_world_id: analysisData.storyWorldId,
          options: {
            create_project: false, // We'll handle saving manually
            story_id: analysisData.storyId,
            extract_characters: true,
            extract_locations: true,
            extract_events: true,
            extract_scenes: true,
            extract_relationships: true,
            extract_dependencies: true, 
            extract_plotlines: true,
            extract_arcs: true,
            debug: true,
            retry_attempt: retryAttempt,
            request_id: requestId,
            bypass_cache: true, // Force no caching
            cache_breaker: cacheBreaker, // Extra cache breaker
            timestamp: new Date().toISOString()
          }
        }
      });
      
      // Race the analysis against the timeout
      logDebug("Waiting for analysis or timeout...");
      const response = await Promise.race([analysisPromise, timeoutPromise]) as any;
      
      // Clear the timeout if the analysis completed
      clearTimeout(timeoutId!);
      
      if (response.error) {
        logDebug("Error from analyze-story edge function:", response.error);
        throw new Error(`Analysis error: ${response.error.message || 'Unknown error'}`);
      }
      
      // Get the actual data
      const data = response.data;
      
      logDebug("Received analysis response:", {
        characters: data.characters?.length || 0,
        locations: data.locations?.length || 0,
        scenes: data.scenes?.length || 0,
        events: data.events?.length || 0,
        plotlines: data.plotlines?.length || 0,
        characterRelationships: data.characterRelationships?.length || 0
      });
      
      // Validate each element type explicitly
      if (!data.characters || !Array.isArray(data.characters)) {
        logDebug("Missing or invalid characters array in response");
        data.characters = [];
      }
      
      if (!data.locations || !Array.isArray(data.locations)) {
        logDebug("Missing or invalid locations array in response");
        data.locations = [];
      }
      
      if (!data.scenes || !Array.isArray(data.scenes)) {
        logDebug("Missing or invalid scenes array in response");
        data.scenes = [];
      }
      
      if (!data.events || !Array.isArray(data.events)) {
        logDebug("Missing or invalid events array in response");
        data.events = [];
      }
      
      if (!data.plotlines || !Array.isArray(data.plotlines)) {
        logDebug("Missing or invalid plotlines array in response");
        data.plotlines = [];
      }
      
      // Ensure all elements have an ID if not already present
      for (let char of data.characters) {
        if (!char.id) char.id = uuidv4();
      }
      
      for (let loc of data.locations) {
        if (!loc.id) loc.id = uuidv4();
      }
      
      for (let scene of data.scenes) {
        if (!scene.id) scene.id = uuidv4();
      }
      
      for (let event of data.events || []) {
        if (!event.id) event.id = uuidv4();
      }
      
      for (let plot of data.plotlines || []) {
        if (!plot.id) plot.id = uuidv4();
      }
      
      logDebug(`Analysis returned: ${data.characters.length} characters, ${data.locations.length} locations, ${data.scenes.length} scenes, ${data.events?.length || 0} events, ${data.plotlines?.length || 0} plotlines`);
      
      await addDetectedItem('System', 'Text analysis complete');
      
      // Store directly in component state AND in ref for redundancy
      setExtractedElements(data);
      extractedElementsRef.current = data;
      
      // Create extraction summary
      const summary = {
        characters: data.characters?.length || 0,
        locations: data.locations?.length || 0,
        events: data.events?.length || 0,
        scenes: data.scenes?.length || 0,
        plotlines: data.plotlines?.length || 0,
        relationships: data.characterRelationships?.length || 0
      };
      
      // Store the extraction data and summary in localStorage for recovery
      try {
        localStorage.setItem(EXTRACTION_DATA_KEY, JSON.stringify(data));
        localStorage.setItem(EXTRACTION_SUMMARY_KEY, JSON.stringify(summary));
        const timestamp = new Date().toISOString();
        localStorage.setItem(EXTRACTION_TIMESTAMP_KEY, timestamp);
        setExtractionTimestamp(timestamp);
        setExtractionSummary(summary);
      } catch (err) {
        logDebug("Error storing extraction data in localStorage:", err);
      }
      
      return data;
    } catch (err: any) {
      logDebug("Error analyzing text:", err);
      throw err;
    }
  };
  
  // IMPROVED DIRECT DATABASE OPERATIONS WITH BETTER DEDUPLICATION
  
  // Direct save character with strict deduplication
  const saveCharacterDirect = async (char: any, storyId: string, storyWorldId: string) => {
    try {
      if (!char.name) {
        logDebug("Skipping character with no name:", char);
        return null;
      }
      
      logDebug("Saving character:", char.name);
      
      // IMPROVED: Strict deduplication check using exact name and story context
      logDebug(`Checking for existing character with exact name "${char.name}" in story ${storyId}`);
      const { data: existingChars, error: checkError } = await supabase
        .from('characters')
        .select('*')
        .eq('name', char.name) // Use exact match
        .eq('story_id', storyId);
      
      if (checkError) {
        logDebug('Error checking for existing character:', checkError);
        throw checkError;
      }
      
      // If character already exists, return it
      if (existingChars && existingChars.length > 0) {
        const existingChar = existingChars[0];
        logDebug(`Character "${char.name}" already exists, skipping creation`, existingChar);
        await addDetectedItem('Character', existingChar.name + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          characters: prev.characters + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          characters: [...prev.characters, existingChar.id]
        }));
        
        return existingChar;
      }
      
      // If no existing character, create a new one
      const charData = {
        id: char.id || uuidv4(),
        name: char.name,
        role: char.role || 'supporting',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: char.description || '',
        appearance: char.appearance || '',
        personality: char.personality || '',
        background: char.background || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logDebug(`Inserting new character "${char.name}"`, charData);
      const { data, error } = await supabase
        .from('characters')
        .insert(charData)
        .select('*')
        .single();
      
      if (error) {
        logDebug('Error saving character:', error);
        throw error;
      }
      
      if (data) {
        logDebug(`Character "${data.name}" saved successfully:`, data);
        await addDetectedItem('Character', data.name + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          characters: prev.characters + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          characters: [...prev.characters, data.id]
        }));
        
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      logDebug("Error in direct character save:", errorDetails);
      setFullErrorDetails(`Character save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save character: ${char.name}`);
      
      // Check if we should retry
      const currentRetries = saveRetryCountRef.current.characters || 0;
      if (currentRetries < MAX_SAVE_RETRIES) {
        saveRetryCountRef.current.characters = currentRetries + 1;
        logDebug(`Retrying character save (attempt ${currentRetries + 1}/${MAX_SAVE_RETRIES})...`);
        
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return saveCharacterDirect(char, storyId, storyWorldId);
      }
      
      return null;
    }
  };
  
  // Direct save location with strict deduplication
  const saveLocationDirect = async (loc: any, storyId: string, storyWorldId: string) => {
    try {
      if (!loc.name) {
        logDebug("Skipping location with no name:", loc);
        return null;
      }
      
      logDebug("Saving location:", loc.name);
      
      // IMPROVED: Strict deduplication check using exact name and story context
      logDebug(`Checking for existing location with exact name "${loc.name}" in story ${storyId}`);
      const { data: existingLocs, error: checkError } = await supabase
        .from('locations')
        .select('*')
        .eq('name', loc.name) // Use exact match
        .eq('story_id', storyId);
      
      if (checkError) {
        logDebug('Error checking for existing location:', checkError);
        throw checkError;
      }
      
      // If location already exists, return it
      if (existingLocs && existingLocs.length > 0) {
        const existingLoc = existingLocs[0];
        logDebug(`Location "${loc.name}" already exists, skipping creation`, existingLoc);
        await addDetectedItem('Location', existingLoc.name + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          locations: prev.locations + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          locations: [...prev.locations, existingLoc.id]
        }));
        
        return existingLoc;
      }
      
      // If no existing location, create a new one
      const locData = {
        id: loc.id || uuidv4(),
        name: loc.name,
        location_type: loc.location_type || 'other',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: loc.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logDebug(`Inserting new location "${loc.name}"`, locData);
      const { data, error } = await supabase
        .from('locations')
        .insert(locData)
        .select('*')
        .single();
      
      if (error) {
        logDebug('Error saving location:', error);
        throw error;
      }
      
      if (data) {
        logDebug(`Location "${data.name}" saved successfully:`, data);
        await addDetectedItem('Location', data.name + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          locations: prev.locations + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          locations: [...prev.locations, data.id]
        }));
        
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      logDebug("Error in direct location save:", errorDetails);
      setFullErrorDetails(`Location save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save location: ${loc.name}`);
      
      // Check if we should retry
      const currentRetries = saveRetryCountRef.current.locations || 0;
      if (currentRetries < MAX_SAVE_RETRIES) {
        saveRetryCountRef.current.locations = currentRetries + 1;
        logDebug(`Retrying location save (attempt ${currentRetries + 1}/${MAX_SAVE_RETRIES})...`);
        
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return saveLocationDirect(loc, storyId, storyWorldId);
      }
      
      return null;
    }
  };
  
  // Direct save scene with strict deduplication
  const saveSceneDirect = async (scene: any, storyId: string) => {
    try {
      if (!scene.title) {
        logDebug("Skipping scene with no title:", scene);
        return null;
      }
      
      logDebug("Saving scene:", scene.title);
      
      // IMPROVED: Strict deduplication check using exact title and story context
      logDebug(`Checking for existing scene with exact title "${scene.title}" in story ${storyId}`);
      const { data: existingScenes, error: checkError } = await supabase
        .from('scenes')
        .select('*')
        .eq('title', scene.title) // Use exact match
        .eq('story_id', storyId);
      
      if (checkError) {
        logDebug('Error checking for existing scene:', checkError);
        throw checkError;
      }
      
      // If scene already exists, return it
      if (existingScenes && existingScenes.length > 0) {
        const existingScene = existingScenes[0];
        logDebug(`Scene "${scene.title}" already exists, skipping creation`, existingScene);
        await addDetectedItem('Scene', existingScene.title + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          scenes: prev.scenes + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          scenes: [...prev.scenes, existingScene.id]
        }));
        
        return existingScene;
      }
      
      // If no existing scene, create a new one
      const sceneData = {
        id: scene.id || uuidv4(),
        title: scene.title,
        content: scene.content || '',
        type: scene.type || 'scene',
        story_id: storyId,
        sequence_number: scene.sequence_number || 0,
        description: scene.content ? (scene.content.length > 200 ? scene.content.substring(0, 200) + '...' : scene.content) : '',
        status: 'finished',
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logDebug(`Inserting new scene "${scene.title}"`, sceneData);
      const { data, error } = await supabase
        .from('scenes')
        .insert(sceneData)
        .select('*')
        .single();
      
      if (error) {
        logDebug('Error saving scene:', error);
        throw error;
      }
      
      if (data) {
        logDebug(`Scene "${data.title}" saved successfully:`, data);
        await addDetectedItem('Scene', data.title + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          scenes: prev.scenes + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          scenes: [...prev.scenes, data.id]
        }));
        
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      logDebug("Error in direct scene save:", errorDetails);
      setFullErrorDetails(`Scene save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save scene: ${scene.title}`);
      
      // Check if we should retry
      const currentRetries = saveRetryCountRef.current.scenes || 0;
      if (currentRetries < MAX_SAVE_RETRIES) {
        saveRetryCountRef.current.scenes = currentRetries + 1;
        logDebug(`Retrying scene save (attempt ${currentRetries + 1}/${MAX_SAVE_RETRIES})...`);
        
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return saveSceneDirect(scene, storyId);
      }
      
      return null;
    }
  };
  
  // Direct save event with strict deduplication
  const saveEventDirect = async (event: any, storyId: string) => {
    try {
      const eventTitle = event.title || event.name;
      if (!eventTitle) {
        logDebug("Skipping event with no title:", event);
        return null;
      }
      
      logDebug("Saving event:", eventTitle);
      
      // IMPROVED: Strict deduplication check using exact title and story context
      logDebug(`Checking for existing event with exact title "${eventTitle}" in story ${storyId}`);
      const { data: existingEvents, error: checkError } = await supabase
        .from('events')
        .select('*')
        .eq('title', eventTitle) // Use exact match
        .eq('story_id', storyId);
      
      if (checkError) {
        logDebug('Error checking for existing event:', checkError);
        throw checkError;
      }
      
      // If event already exists, return it
      if (existingEvents && existingEvents.length > 0) {
        const existingEvent = existingEvents[0];
        logDebug(`Event "${eventTitle}" already exists, skipping creation`, existingEvent);
        await addDetectedItem('Event', existingEvent.title + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          events: prev.events + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          events: [...prev.events, existingEvent.id]
        }));
        
        return existingEvent;
      }
      
      // If no existing event, create a new one
      const eventData = {
        id: event.id || uuidv4(),
        title: eventTitle,
        story_id: storyId,
        description: event.description || '',
        sequence_number: event.sequence_number || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logDebug(`Inserting new event "${eventTitle}"`, eventData);
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select('*')
        .single();
      
      if (error) {
        logDebug('Error saving event:', error);
        throw error;
      }
      
      if (data) {
        logDebug(`Event "${data.title}" saved successfully:`, data);
        await addDetectedItem('Event', data.title + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          events: prev.events + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          events: [...prev.events, data.id]
        }));
        
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      logDebug("Error in direct event save:", errorDetails);
      setFullErrorDetails(`Event save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save event: ${event.title || event.name}`);
      
      // Check if we should retry
      const currentRetries = saveRetryCountRef.current.events || 0;
      if (currentRetries < MAX_SAVE_RETRIES) {
        saveRetryCountRef.current.events = currentRetries + 1;
        logDebug(`Retrying event save (attempt ${currentRetries + 1}/${MAX_SAVE_RETRIES})...`);
        
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return saveEventDirect(event, storyId);
      }
      
      return null;
    }
  };
  
  // Direct save plotline with strict deduplication
  const savePlotlineDirect = async (plotline: any, storyId: string) => {
    try {
      if (!plotline.title) {
        logDebug("Skipping plotline with no title:", plotline);
        return null;
      }
      
      logDebug("Saving plotline:", plotline.title);
      
      // IMPROVED: Strict deduplication check using exact title and story context
      logDebug(`Checking for existing plotline with exact title "${plotline.title}" in story ${storyId}`);
      const { data: existingPlotlines, error: checkError } = await supabase
        .from('plotlines')
        .select('*')
        .eq('title', plotline.title) // Use exact match
        .eq('story_id', storyId);
      
      if (checkError) {
        logDebug('Error checking for existing plotline:', checkError);
        throw checkError;
      }
      
      // If plotline already exists, return it
      if (existingPlotlines && existingPlotlines.length > 0) {
        const existingPlotline = existingPlotlines[0];
        logDebug(`Plotline "${plotline.title}" already exists, skipping creation`, existingPlotline);
        await addDetectedItem('Plotline', existingPlotline.title + ' (existing)');
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          plotlines: prev.plotlines + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          plotlines: [...prev.plotlines, existingPlotline.id]
        }));
        
        return existingPlotline;
      }
      
      // If no existing plotline, create a new one
      const plotlineData = {
        id: plotline.id || uuidv4(),
        title: plotline.title,
        description: plotline.description || '',
        plotline_type: plotline.plotline_type || 'main',
        story_id: storyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logDebug(`Inserting new plotline "${plotline.title}"`, plotlineData);
      const { data, error } = await supabase
        .from('plotlines')
        .insert(plotlineData)
        .select('*')
        .single();
      
      if (error) {
        logDebug('Error saving plotline:', error);
        throw error;
      }
      
      if (data) {
        logDebug(`Plotline "${data.title}" saved successfully:`, data);
        await addDetectedItem('Plotline', data.title + ' (new)');
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          plotlines: prev.plotlines + 1
        }));
        
        setSavedEntityIds(prev => ({
          ...prev,
          plotlines: [...prev.plotlines, data.id]
        }));
        
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      logDebug("Error in direct plotline save:", errorDetails);
      setFullErrorDetails(`Plotline save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save plotline: ${plotline.title}`);
      
      // Check if we should retry
      const currentRetries = saveRetryCountRef.current.plotlines || 0;
      if (currentRetries < MAX_SAVE_RETRIES) {
        saveRetryCountRef.current.plotlines = currentRetries + 1;
        logDebug(`Retrying plotline save (attempt ${currentRetries + 1}/${MAX_SAVE_RETRIES})...`);
        
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        return savePlotlineDirect(plotline, storyId);
      }
      
      return null;
    }
  };
  
  // DIRECT save of character relationships with strict deduplication
  const saveCharacterRelationshipDirect = async (rel: any, characterNameToIdMap: Record<string, string>, storyId: string) => {
    try {
      if (!rel.character1_name || !rel.character2_name) {
        logDebug("Skipping relationship with missing character names:", rel);
        return null;
      }
      
      // Check if both characters exist in our map
      const char1Id = characterNameToIdMap[rel.character1_name];
      const char2Id = characterNameToIdMap[rel.character2_name];
      
      if (!char1Id || !char2Id) {
        logDebug(`Cannot save relationship: character ID not found for "${rel.character1_name}" or "${rel.character2_name}"`, {
          characterNameToIdMap,
          character1_name: rel.character1_name,
          character2_name: rel.character2_name
        });
        return null;
      }
      
      logDebug(`Saving relationship: ${rel.character1_name} - ${rel.character2_name}`);
      
      // IMPROVED: More precise check for existing relationship 
      const exactQuery = `(character1_id.eq.${char1Id},character2_id.eq.${char2Id})`;
      const reverseQuery = `(character1_id.eq.${char2Id},character2_id.eq.${char1Id})`;
      
      // Check for existing relationship between these characters
      const { data: existingRels, error: checkError } = await supabase
        .from('character_relationships')
        .select('*')
        .or(`${exactQuery},${reverseQuery}`)
        .eq('story_id', storyId);
      
      if (checkError) {
        logDebug('Error checking for existing relationship:', checkError);
        throw checkError;
      }
      
      // If relationship already exists, return it
      if (existingRels && existingRels.length > 0) {
        const existingRel = existingRels[0];
        logDebug(`Relationship between "${rel.character1_name}" and "${rel.character2_name}" already exists, skipping creation`, existingRel);
        await addDetectedItem('Relationship', `${rel.character1_name} - ${rel.character2_name} (existing)`);
        
        // Update save results (existing)
        setSaveResults(prev => ({
          ...prev,
          relationships: prev.relationships + 1
        }));
        
        return existingRel;
      }
      
      // If no existing relationship, create a new one
      const relData = {
        id: uuidv4(),
        character1_id: char1Id,
        character2_id: char2Id,
        relationship_type: rel.relationship_type || 'other',
        description: rel.description || '',
        intensity: rel.intensity || 5,
        story_id: storyId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      logDebug(`Inserting new relationship between "${rel.character1_name}" and "${rel.character2_name}"`, relData);
      const { data, error } = await supabase
        .from('character_relationships')
        .insert(relData)
        .select('*')
        .single();
      
      if (error) {
        logDebug('Error saving relationship:', error);
        throw error;
      }
      
      if (data) {
        logDebug(`Relationship saved successfully:`, data);
        await addDetectedItem('Relationship', `${rel.character1_name} - ${rel.character2_name} (new)`);
        
        // Update save results (new)
        setSaveResults(prev => ({
          ...prev,
          relationships: prev.relationships + 1
        }));
        
        return data;
      }
      
      return null;
    } catch (err) {
      const errorDetails = err instanceof Error ? err.stack || err.message : String(err);
      logDebug("Error in direct relationship save:", errorDetails);
      setFullErrorDetails(`Relationship save error: ${errorDetails}`);
      await addDetectedItem('Error', `Failed to save relationship`);
      
      // Relationships don't have a specific retry counter, but we can retry a few times
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple retry with just one attempt
      try {
        return await saveCharacterRelationshipDirect(rel, characterNameToIdMap, storyId);
      } catch (retryErr) {
        logDebug("Retry failed for relationship save:", retryErr);
        return null;
      }
    }
  };
  
  // Enhanced data saving approach using batch processing and error handling
  const saveElementsDirectly = async () => {
    try {
      logDebug("=== Starting direct database save process ===");
      
      // Reset retry counters
      saveRetryCountRef.current = {
        characters: 0,
        locations: 0,
        events: 0,
        scenes: 0,
        plotlines: 0
      };
      
      // Get elements from component state or ref as backup
      const elements = extractedElements || extractedElementsRef.current;
      if (!elements) {
        logDebug("No extracted elements found in state or ref");
        throw new Error('No extracted elements found in component state');
      }
      
      logDebug("Extracted elements for saving:", {
        characters: elements.characters?.length || 0,
        locations: elements.locations?.length || 0,
        scenes: elements.scenes?.length || 0,
        events: elements.events?.length || 0,
        plotlines: elements.plotlines?.length || 0
      });
      
      // Get analysis data - use our robust accessor
      const analysisData = getAnalysisData();
      if (!analysisData) {
        logDebug("No analysis data found when trying to save");
        throw new Error('No analysis data found. Please try extracting the data again.');
      }
      
      logDebug("Using analysis data for save:", {
        storyId: analysisData.storyId,
        storyWorldId: analysisData.storyWorldId,
        files: analysisData.files?.length || 0
      });
      
      // Verify we have valid story and storyWorld IDs
      if (!analysisData.storyId) {
        logDebug("Missing storyId in analysis data");
        throw new Error('Missing storyId in analysis data');
      }
      
      if (!analysisData.storyWorldId) {
        logDebug("Missing storyWorldId in analysis data");
        throw new Error('Missing storyWorldId in analysis data');
      }
      
      // Reset saved entity IDs
      setSavedEntityIds({
        characters: [],
        locations: [],
        events: [],
        scenes: [],
        plotlines: []
      });
      
      // Reset save results counters
      setSaveResults({
        characters: 0,
        locations: 0,
        events: 0,
        scenes: 0,
        plotlines: 0,
        relationships: 0
      });
      
      const totalSteps = 5; // Characters, locations, scenes, events, plotlines
      let currentStep = 0;
      
      // Save characters with direct db access
      let savedCharacters = [];
      if (elements.characters?.length > 0) {
        setAnalysisStage(`Saving characters (${elements.characters.length})...`);
        await addDetectedItem('System', `Saving ${elements.characters.length} characters`);
        
        // Parallelize character saves in batches to improve performance
        const BATCH_SIZE = 5; // Process 5 characters at a time
        for (let i = 0; i < elements.characters.length; i += BATCH_SIZE) {
          const batch = elements.characters.slice(i, i + BATCH_SIZE);
          
          // Process batch in parallel
          const batchResults = await Promise.all(
            batch.map(async (character, idx) => {
              try {
                logDebug(`Saving character ${i + idx + 1}/${elements.characters.length}: ${character.name}`);
                return await saveCharacterDirect(character, analysisData.storyId, analysisData.storyWorldId);
              } catch (err) {
                logDebug(`Error saving character at index ${i + idx}:`, err);
                return null;
              }
            })
          );
          
          // Add successful saves to our results
          savedCharacters = [...savedCharacters, ...batchResults.filter(Boolean)];
          
          // Update progress
          const characterProgress = Math.min((i + BATCH_SIZE) / elements.characters.length, 1);
          setSavingProgress((currentStep + characterProgress) / totalSteps * 100);
        }
        
        logDebug(`Saved ${savedCharacters.length}/${elements.characters.length} characters`);
      }
      
      currentStep++;
      
      // Save locations with direct db access
      let savedLocations = [];
      if (elements.locations?.length > 0) {
        setAnalysisStage(`Saving locations (${elements.locations.length})...`);
        await addDetectedItem('System', `Saving ${elements.locations.length} locations`);
        
        // Parallelize location saves in batches
        const BATCH_SIZE = 5;
        for (let i = 0; i < elements.locations.length; i += BATCH_SIZE) {
          const batch = elements.locations.slice(i, i + BATCH_SIZE);
          
          // Process batch in parallel
          const batchResults = await Promise.all(
            batch.map(async (location, idx) => {
              try {
                logDebug(`Saving location ${i + idx + 1}/${elements.locations.length}: ${location.name}`);
                return await saveLocationDirect(location, analysisData.storyId, analysisData.storyWorldId);
              } catch (err) {
                logDebug(`Error saving location at index ${i + idx}:`, err);
                return null;
              }
            })
          );
          
          // Add successful saves to our results
          savedLocations = [...savedLocations, ...batchResults.filter(Boolean)];
          
          // Update progress
          const locationProgress = Math.min((i + BATCH_SIZE) / elements.locations.length, 1);
          setSavingProgress((currentStep + locationProgress) / totalSteps * 100);
        }
        
        logDebug(`Saved ${savedLocations.length}/${elements.locations.length} locations`);
      }
      
      currentStep++;
      
      // Save scenes with direct db access
      let savedScenes = [];
      if (elements.scenes?.length > 0) {
        setAnalysisStage(`Saving scenes (${elements.scenes.length})...`);
        await addDetectedItem('System', `Saving ${elements.scenes.length} scenes`);
        
        // Save scenes sequentially to maintain sequence integrity
        for (let i = 0; i < elements.scenes.length; i++) {
          try {
            const scene = elements.scenes[i];
            logDebug(`Saving scene ${i+1}/${elements.scenes.length}: ${scene.title}`);
            const savedScene = await saveSceneDirect(scene, analysisData.storyId);
            if (savedScene) {
              savedScenes.push(savedScene);
            }
          } catch (err) {
            logDebug(`Error saving scene at index ${i}:`, err);
            // Continue with next scene despite errors
          }
          
          // Update progress
          const sceneProgress = (i + 1) / elements.scenes.length;
          setSavingProgress((currentStep + sceneProgress) / totalSteps * 100);
        }
        
        logDebug(`Saved ${savedScenes.length}/${elements.scenes.length} scenes`);
      }
      
      currentStep++;
      
      // Save events with direct db access
      let savedEvents = [];
      if (elements.events?.length > 0) {
        setAnalysisStage(`Saving events (${elements.events.length})...`);
        await addDetectedItem('System', `Saving ${elements.events.length} events`);
        
        // Save events sequentially to maintain sequence integrity
        for (let i = 0; i < elements.events.length; i++) {
          try {
            const event = elements.events[i];
            const eventTitle = event.title || event.name;
            logDebug(`Saving event ${i+1}/${elements.events.length}: ${eventTitle}`);
            const savedEvent = await saveEventDirect(event, analysisData.storyId);
            if (savedEvent) {
              savedEvents.push(savedEvent);
            }
          } catch (err) {
            logDebug(`Error saving event at index ${i}:`, err);
            // Continue with next event despite errors
          }
          
          // Update progress
          const eventProgress = (i + 1) / elements.events.length;
          setSavingProgress((currentStep + eventProgress) / totalSteps * 100);
        }
        
        logDebug(`Saved ${savedEvents.length}/${elements.events.length} events`);
      }
      
      currentStep++;
      
      // Save plotlines with direct db access
      let savedPlotlines = [];
      if (elements.plotlines?.length > 0) {
        setAnalysisStage(`Saving plotlines (${elements.plotlines.length})...`);
        await addDetectedItem('System', `Saving ${elements.plotlines.length} plotlines`);
        
        // Parallelize plotline saves in batches
        const BATCH_SIZE = 3;
        for (let i = 0; i < elements.plotlines.length; i += BATCH_SIZE) {
          const batch = elements.plotlines.slice(i, i + BATCH_SIZE);
          
          // Process batch in parallel
          const batchResults = await Promise.all(
            batch.map(async (plotline, idx) => {
              try {
                logDebug(`Saving plotline ${i + idx + 1}/${elements.plotlines.length}: ${plotline.title}`);
                return await savePlotlineDirect(plotline, analysisData.storyId);
              } catch (err) {
                logDebug(`Error saving plotline at index ${i + idx}:`, err);
                return null;
              }
            })
          );
          
          // Add successful saves to our results
          savedPlotlines = [...savedPlotlines, ...batchResults.filter(Boolean)];
          
          // Update progress
          const plotlineProgress = Math.min((i + BATCH_SIZE) / elements.plotlines.length, 1);
          setSavingProgress((currentStep + plotlineProgress) / totalSteps * 100);
        }
        
        logDebug(`Saved ${savedPlotlines.length}/${elements.plotlines.length} plotlines`);
      }
      
      currentStep++;
      setSavingProgress(100);
      
      // Save character relationships after characters are saved
      if (elements.characterRelationships?.length > 0 && savedCharacters.length > 0) {
        setAnalysisStage(`Saving character relationships (${elements.characterRelationships.length})...`);
        await addDetectedItem('System', `Processing ${elements.characterRelationships.length} character relationships`);
        
        // Create a map of character names to IDs
        const characterNameToIdMap: Record<string, string> = {};
        savedCharacters.forEach(char => {
          characterNameToIdMap[char.name] = char.id;
        });
        
        logDebug("Character name to ID map created with", {
          mapSize: Object.keys(characterNameToIdMap).length,
          characters: savedCharacters.length
        });
        
        // Save each relationship individually
        let validRelationships = 0;
        let failedRelationships = 0;
        
        // Use batching for relationships too
        const BATCH_SIZE = 5;
        for (let i = 0; i < elements.characterRelationships.length; i += BATCH_SIZE) {
          const batch = elements.characterRelationships.slice(i, i + BATCH_SIZE);
          
          const batchResults = await Promise.all(
            batch.map(async (relationship, idx) => {
              try {
                logDebug(`Saving relationship ${i + idx + 1}/${elements.characterRelationships.length}: ${relationship.character1_name} - ${relationship.character2_name}`);
                return await saveCharacterRelationshipDirect(
                  relationship, 
                  characterNameToIdMap, 
                  analysisData.storyId
                );
              } catch (err) {
                logDebug(`Error saving relationship at index ${i + idx}:`, err);
                return null;
              }
            })
          );
          
          validRelationships += batchResults.filter(Boolean).length;
          failedRelationships += batchResults.filter(r => r === null).length;
        }
        
        await addDetectedItem('System', `Saved ${validRelationships} character relationships, ${failedRelationships} failed`);
      }
      
      // Finalize
      setAnalysisStage('Finalizing analysis...');
      await addDetectedItem('System', 'Analysis completed successfully');
      
      // Get final save counts
      const finalResults = {
        characters: saveResults.characters,
        locations: saveResults.locations,
        events: saveResults.events,
        scenes: saveResults.scenes,
        plotlines: saveResults.plotlines,
        relationships: saveResults.relationships
      };
      
      logDebug("Final save results:", finalResults);
      
      // Store minimal results for the results page
      const analysisResults = {
        savedEntityIds,
        storyId: analysisData.storyId,
        storyWorldId: analysisData.storyWorldId,
        counts: finalResults
      };
      
      // Save analysis results to session storage for the results page
      logDebug("Saving analysis results to session storage:", analysisResults);
      sessionStorage.setItem('analysisResults', JSON.stringify(analysisResults));
      
      // Also make a backup in localStorage
      localStorage.setItem('analysisResultsBackup', JSON.stringify(analysisResults));
      
      // Clear extraction flags now that save is complete
      localStorage.removeItem(EXTRACTION_COMPLETE_KEY);
      localStorage.removeItem(EXTRACTION_DATA_KEY);
      localStorage.removeItem(EXTRACTION_SUMMARY_KEY);
      localStorage.removeItem(EXTRACTION_TIMESTAMP_KEY);
      localStorage.removeItem(EXTRACTION_STAGE_KEY);
      
      // Hide the extraction review screen
      hideExtractionReviewScreen();
      
      logDebug("=== Direct database save process completed successfully ===");
      
      return finalResults;
    } catch (err: any) {
      const errorDetails = err instanceof Error ? 
        `${err.message}\n${err.stack || ''}` : 
        String(err);
        
      logDebug("Error in direct save process:", errorDetails);
      setFullErrorDetails(`Save error: ${errorDetails}`);
      throw err;
    }
  };

  // Utility function to generate a unique ID for detected items
  const generateUniqueId = (type: string, name: string): string => {
    return `${type}-${name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Add a detected item with a small delay to create visual feedback
  const addDetectedItem = async (type: string, name: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const itemId = generateUniqueId(type, name);
        setDetectedItems(prev => [...prev, { type, name, id: itemId }]);
        resolve();
      }, Math.random() * 50 + 10); // Faster delay between 10-60ms
    });
  };

  // Extract narrative elements phase with improved resilience
  const processExtraction = async () => {
    try {
      // Mark extraction as started
      setExtractionStarted(true);
      
      // Reset extraction progress
      setExtractionProgress(0);
      
      // IMPORTANT: Clear cache to force a fresh extraction
      if (forceNewExtraction || isNewExtractionRef.current) {
        clearAnalysisCache();
      }
      
      // Get analysis data from session storage or backup sources
      const analysisData = getAnalysisData();
      
      if (!analysisData) {
        logDebug("No analysis data found during extraction phase");
        setError('No analysis data found. Please return to the import screen.');
        setIsAnalyzing(false);
        setAnalysisPhase('error');
        return;
      }
      
      // Store in component state for UI
      setCurrentFile(analysisData.files[0]?.name || '');
      setStoryId(analysisData.storyId);
      setStoryWorldId(analysisData.storyWorldId);
      
      // Debug the stored analysis data
      logDebug('Analysis data for extraction:', analysisData);
      setDebugInfo(`Story ID: ${analysisData.storyId}, Files: ${analysisData.files.length}`);
      
      // Check if there are any files to analyze
      if (!analysisData.files || analysisData.files.length === 0) {
        logDebug("No files found for analysis");
        setError('No files found for analysis. Please upload a file and try again.');
        setIsAnalyzing(false);
        setAnalysisPhase('error');
        return;
      }
      
      // ALWAYS perform a fresh extraction - no caching
      let extractAttempts = 0;
      const MAX_EXTRACT_ATTEMPTS = 3;
      let elements = null;
      
      while (extractAttempts < MAX_EXTRACT_ATTEMPTS && !elements) {
        try {
          setAnalysisPhase('extracting');
          setRetryAttempt(extractAttempts);
          
          // Update UI if this is a retry
          if (extractAttempts > 0) {
            await addDetectedItem('System', `Retry attempt ${extractAttempts}...`);
            setAnalysisStage(`Retry ${extractAttempts}/${MAX_EXTRACT_ATTEMPTS}: Extracting narrative elements...`);
          }
          
          // First, artificially slow down to show extraction progress UI
          await simulateProcessingDelay(4000);
          
          elements = await analyzeText(analysisData);
          
          if (elements) {
            // IMPORTANT FIX: Force showing the extraction review screen
            logDebug("EXTRACTION COMPLETE: Setting to extracted phase and stopping analysis");
            
            // Display a sample of the extracted elements in the UI
            await addDetectedItem('System', 'Processing extracted elements...');
            
            if (elements.characters?.length > 0) {
              await addDetectedItem('System', `Found ${elements.characters.length} characters`);
              for (const char of elements.characters.slice(0, 3)) {
                await addDetectedItem('Character', char.name);
              }
            }
            
            if (elements.locations?.length > 0) {
              await addDetectedItem('System', `Found ${elements.locations.length} locations`);
              for (const loc of elements.locations.slice(0, 3)) {
                await addDetectedItem('Location', loc.name);
              }
            }
            
            if (elements.scenes?.length > 0) {
              await addDetectedItem('System', `Found ${elements.scenes.length} scenes`);
              for (const scene of elements.scenes.slice(0, 3)) {
                await addDetectedItem('Scene', scene.title);
              }
            }
            
            if (elements.plotlines?.length > 0) {
              await addDetectedItem('System', `Found ${elements.plotlines.length} plotlines`);
              for (const plot of elements.plotlines.slice(0, 3)) {
                await addDetectedItem('Plotline', plot.title);
              }
            }
            
            // Add artificial delay to ensure user sees the extraction results
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Store original UI state before forcing review screen
            storeOriginalUIState();
            
            // Call our utility function that force-sets the proper state
            forceExtractionReviewScreen();
          }
          
          break;
        } catch (err: any) {
          logDebug(`Extract attempt ${extractAttempts + 1} failed:`, err);
          
          // If we've reached max attempts, propagate the error
          if (extractAttempts === MAX_EXTRACT_ATTEMPTS - 1) {
            throw err;
          }
          
          // Otherwise, log retry and continue
          await addDetectedItem('Warning', `Extraction attempt failed: ${err.message}`);
          extractAttempts++;
        }
      }
      
      if (!elements) {
        throw new Error('Failed to extract narrative elements after multiple attempts');
      }
    } catch (err: any) {
      logDebug("Error during extraction:", err);
      setError(`Extraction error: ${err.message || 'Unknown error'}`);
      setFullErrorDetails(err instanceof Error ? err.stack || err.message : String(err));
      await addDetectedItem('Error', `Extraction error: ${err.message || 'Unknown error'}`);
      setAnalysisPhase('error');
      setIsAnalyzing(false);
    }
  };
  
  // Improved direct database save phase with comprehensive checking and setup
  const processSavingDirectly = async () => {
    try {
      logDebug("=== Starting processSavingDirectly ===");
      
      // Remove the extraction complete flag - now we're saving
      localStorage.removeItem(EXTRACTION_COMPLETE_KEY);
      setMustShowExtractionReview(false);
      
      // Hide the extraction review screen
      hideExtractionReviewScreen();
      
      // 1. Check if the user is authenticated
      try {
        const { data: { session } } = await supabase.auth.getSession();
        logDebug("Authentication check:", { hasSession: !!session });
      } catch (error) {
        logDebug("Error checking auth session:", error);
      }
      
      setIsAnalyzing(true);
      setAnalysisPhase('saving');
      setAnalysisStage('Starting to save elements directly to database...');
      
      // 2. Verify extracted elements - try multiple sources
      let elements = extractedElements || extractedElementsRef.current;
      if (!elements) {
        // Try to load from localStorage
        const extractionDataStr = localStorage.getItem(EXTRACTION_DATA_KEY);
        if (extractionDataStr) {
          try {
            elements = JSON.parse(extractionDataStr);
            // Restore to component state
            setExtractedElements(elements);
            extractedElementsRef.current = elements;
          } catch (err) {
            logDebug("Error parsing extraction data from localStorage:", err);
          }
        }
        
        if (!elements) {
          logDebug("No extracted elements found when trying to save");
          throw new Error('No extracted elements found. Please try extracting the data again.');
        }
      }
      
      logDebug("Extracted elements available for saving:", {
        characters: elements.characters?.length || 0,
        locations: elements.locations?.length || 0
      });
      
      // 3. Get analysis data - use our robust accessor
      const analysisData = getAnalysisData();
      
      // 4. Validate we have necessary data
      if (!analysisData) {
        const errorMsg = 'No analysis data found. Please restart the analysis process.';
        logDebug(errorMsg);
        throw new Error(errorMsg);
      }
      
      logDebug("Analysis data for saving:", {
        storyId: analysisData.storyId,
        storyWorldId: analysisData.storyWorldId,
        fileName: analysisData.files?.[0]?.name || 'unknown'
      });
      
      // 5. Verify IDs
      if (!analysisData.storyId || !analysisData.storyWorldId) {
        const missingFields = [];
        if (!analysisData.storyId) missingFields.push('storyId');
        if (!analysisData.storyWorldId) missingFields.push('storyWorldId');
        
        const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
        logDebug(errorMsg);
        throw new Error(errorMsg);
      }
      
      // 6. Verify supabase connection
      try {
        const { data, error } = await supabase.from('stories').select('id').limit(1);
        if (error) {
          logDebug("Database connection test failed:", error);
          throw new Error(`Database connection error: ${error.message}`);
        }
        logDebug("Database connection test successful:", { hasData: !!data });
      } catch (error) {
        logDebug("Error testing database connection:", error);
        throw new Error('Unable to connect to database. Please check your network connection.');
      }
      
      // 7. Reset retry counters before starting
      saveRetryCountRef.current = {
        characters: 0,
        locations: 0,
        events: 0,
        scenes: 0,
        plotlines: 0
      };
      
      // 8. Now start the actual saving process
      logDebug(`Starting to save with storyId=${analysisData.storyId}, storyWorldId=${analysisData.storyWorldId}`);
      
      // 9. Save extracted elements to database using improved direct approach
      const results = await saveElementsDirectly();
      
      logDebug("=== Direct save results complete ===");
      logDebug("Final save results:", results);
      
      setAnalysisPhase('complete');
    } catch (err: any) {
      logDebug("Error during direct saving:", err);
      
      // Get detailed error info
      const detailedError = err instanceof Error ? 
        `${err.message}\n${err.stack || ''}` : 
        String(err);
      
      setError(`Saving error: ${err.message || 'Unknown error'}`);
      setFullErrorDetails(detailedError);
      await addDetectedItem('Error', `Saving error: ${err.message || 'Unknown error'}`);
      setAnalysisPhase('error');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Start extraction when component mounts
  useEffect(() => {
    // Start extraction only if it's not already started and we're not already showing extraction review
    if (!extractionStarted && !mustShowExtractionReview) {
      logDebug("Starting initial extraction");
      processExtraction();
    }
  }, [extractionStarted, mustShowExtractionReview]);
  
  // Navigation handler with improved data persistence
  const handleViewResults = () => {
    logDebug("Navigating to analysis results page");
    
    // Verify we have the necessary data in session storage
    const analysisDataStr = sessionStorage.getItem('analysisData');
    const analysisResultsStr = sessionStorage.getItem('analysisResults');
    
    logDebug("Session storage before navigation:", {
      hasAnalysisData: !!analysisDataStr,
      hasAnalysisResults: !!analysisResultsStr
    });
    
    // If either is missing, try to recover from backup
    if (!analysisDataStr || !analysisResultsStr) {
      logDebug("Missing critical data in session storage, attempting recovery");
      
      if (!analysisDataStr) {
        const backupDataStr = localStorage.getItem('analysisDataBackup');
        if (backupDataStr) {
          sessionStorage.setItem('analysisData', backupDataStr);
          logDebug("Restored analysis data from backup");
        }
      }
      
      if (!analysisResultsStr) {
        const backupResultsStr = localStorage.getItem('analysisResultsBackup');
        if (backupResultsStr) {
          sessionStorage.setItem('analysisResults', backupResultsStr);
          logDebug("Restored analysis results from backup");
        }
      }
    }
    
    // Now navigate
    navigate('/analysis-results');
  };

  // Enhanced retry logic to handle different failure modes
  const handleRetry = () => {
    // If we have extracted elements but failed to save, retry only the saving phase
    if (analysisPhase === 'error' && (extractedElements || extractedElementsRef.current)) {
      logDebug("Retrying saving phase only");
      // Reset relevant states
      setError(null);
      setFullErrorDetails(null);
      setIsAnalyzing(true);
      
      // Start from saving phase with direct approach
      processSavingDirectly();
    } else {
      logDebug("Performing full retry - resetting state and reloading page");
      // Full retry - Reset everything and reload
      setDetectedItems([]);
      setExtractedElements(null);
      extractedElementsRef.current = null;
      setExtractionStarted(false);
      setFullErrorDetails(null);
      setMustShowExtractionReview(false);
      extractionCompleteRef.current = false;
      
      // Flag as forced new extraction
      isNewExtractionRef.current = true;
      setForceNewExtraction(true);
      
      // Clear localStorage flags
      clearAnalysisCache();
      
      // Hide the extraction review screen
      hideExtractionReviewScreen();
      
      // Force page reload to clear any browser cache/state
      window.location.reload();
    }
  };

  // Continue to saving handler with improved data integrity checks
  const handleContinueToSaving = () => {
    logDebug("USER EXPLICITLY CLICKED 'Continue to Save Elements'");
    
    // Clear the extraction complete flag
    localStorage.removeItem(EXTRACTION_COMPLETE_KEY);
    setMustShowExtractionReview(false);
    
    // Hide the extraction review screen
    hideExtractionReviewScreen();
    
    // Backup session storage data before continuing
    const analysisDataStr = sessionStorage.getItem('analysisData');
    logDebug("Session storage before continuing to save:", {
      hasAnalysisData: !!analysisDataStr
    });
    
    if (!analysisDataStr) {
      logDebug("WARNING: No analysis data in session storage before saving phase!");
      // Try to recreate it from component state
      if (storyId && storyWorldId && (extractedElements || extractedElementsRef.current)) {
        logDebug("Recreating analysis data from component state");
        const reconstructedData = {
          storyId,
          storyWorldId,
          files: [{
            name: currentFile,
            type: 'text/plain',
            content: null // We don't need the content anymore
          }]
        };
        sessionStorage.setItem('analysisData', JSON.stringify(reconstructedData));
        localStorage.setItem('analysisDataBackup', JSON.stringify(reconstructedData));
        analysisDataRef.current = reconstructedData;
        logDebug("Reconstructed analysis data:", reconstructedData);
      }
    }
    
    // Verify we have the extracted data before proceeding
    if (!extractedElements && !extractedElementsRef.current) {
      // Try to get from localStorage
      const extractionDataStr = localStorage.getItem(EXTRACTION_DATA_KEY);
      if (extractionDataStr) {
        try {
          const extractionData = JSON.parse(extractionDataStr);
          setExtractedElements(extractionData);
          extractedElementsRef.current = extractionData;
        } catch (err) {
          logDebug("Error parsing extraction data:", err);
        }
      }
      
      // If still no data, show error
      if (!extractedElements && !extractedElementsRef.current) {
        logDebug("ERROR: Extracted elements missing before save phase");
        setError("Missing extracted elements data. Please try extracting again.");
        return;
      }
    }
    
    // Now allow saving to proceed
    logDebug("PROCEEDING TO SAVE PHASE: User has reviewed extraction and confirmed");
    forceExtractionReviewRef.current = false;
    
    processSavingDirectly();
  };

  // Force new extraction with complete reset
  const handleFreshExtraction = () => {
    logDebug("Forcing new extraction");
    // Clear state and restart extraction
    setDetectedItems([]);
    setExtractedElements(null);
    extractedElementsRef.current = null;
    setExtractionStarted(false);
    setAnalysisPhase('extracting');
    setIsAnalyzing(true);
    setFullErrorDetails(null);
    setMustShowExtractionReview(false);
    extractionCompleteRef.current = false;
    
    // Flag for force new extraction
    isNewExtractionRef.current = true;
    setForceNewExtraction(true);
    
    // Clear localStorage flags - generate new cache breaker
    clearAnalysisCache();
    
    // Hide the extraction review screen
    hideExtractionReviewScreen();
    
    // Force page reload to clear any browser cache/state
    window.location.reload();
  };

  // Helper function for analysis phase display
  const getAnalysisPhaseDisplay = () => {
    switch (analysisPhase) {
      case 'extracting':
        return 'Extracting Narrative Elements';
      case 'saving':
        return 'Saving To Database';
      case 'extracted':
        return 'Extraction Complete';
      case 'complete':
        return 'Analysis Complete';
      case 'error':
        return 'Error';
      default:
        return 'Processing';
    }
  };
  
  // Render a different view for each analysis phase
  return (
    <div className="analysis-progress-container">
      <h1>Analyzing Story</h1>
      
      {mustShowExtractionReview && (
        // This renders a placeholder during the extraction review state,
        // The actual UI is created directly in the DOM via showExtractionReviewScreen
        <div id={EXTRACTION_REVIEW_CONTAINER_ID} style={{ display: 'none' }}>
          <div className="extraction-review-placeholder">
            {/* Will be replaced by DOM manipulation */}
            Extraction review loading...
          </div>
        </div>
      )}
      
      {!mustShowExtractionReview && (
        <>
          {isAnalyzing && (
            <div className="progress-indicator">
              <div className="spinner"></div>
              <p>{analysisPhase === 'extracting' ? 'Extracting narrative elements...' : 'Saving elements to database...'}</p>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${analysisPhase === 'extracting' ? extractionProgress : savingProgress}%` 
                  }}
                ></div>
                <div className="progress-text">
                  {analysisPhase === 'extracting' ? 
                    `${Math.round(extractionProgress)}%` : 
                    `${Math.round(savingProgress)}%`}
                </div>
              </div>
              
              <div className="analysis-phase">{getAnalysisPhaseDisplay()}</div>
              <div className="analysis-stage">{analysisStage}</div>
            </div>
          )}
          
          {!isAnalyzing && analysisPhase === 'complete' && (
            <div className="analysis-complete">
              <div className="success-icon">✓</div>
              <h2>Analysis Completed Successfully!</h2>
              <p>The narrative elements have been extracted and saved to your database.</p>
              
              <div className="summary">
                <div className="summary-item">
                  <h3>Characters</h3>
                  <span className="count">{saveResults.characters}</span>
                </div>
                <div className="summary-item">
                  <h3>Locations</h3>
                  <span className="count">{saveResults.locations}</span>
                </div>
                <div className="summary-item">
                  <h3>Events</h3>
                  <span className="count">{saveResults.events}</span>
                </div>
                <div className="summary-item">
                  <h3>Scenes</h3>
                  <span className="count">{saveResults.scenes}</span>
                </div>
                <div className="summary-item">
                  <h3>Plotlines</h3>
                  <span className="count">{saveResults.plotlines}</span>
                </div>
              </div>
              
              <div className="actions-container">
                <button className="view-results-button" onClick={handleViewResults}>
                  View Detailed Results
                </button>
              </div>
            </div>
          )}
          
          {!isAnalyzing && analysisPhase === 'error' && (
            <div className="analysis-complete">
              <div className="error-icon">!</div>
              <h2>Analysis Error</h2>
              <p>There was an issue during the analysis process.</p>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              {fullErrorDetails && (
                <div className="debug-info">
                  <h3>Error Details</h3>
                  <pre>{fullErrorDetails}</pre>
                </div>
              )}
              
              <div className="actions-container">
                <button className="retry-button" onClick={handleRetry}>
                  Retry Analysis
                </button>
              </div>
            </div>
          )}
          
          <div className="detection-log">
            <h3>Detection Log</h3>
            <div className="log-entries">
              {detectedItems.map(item => (
                <div key={item.id} className="log-entry">
                  <span className={`item-type ${item.type.toLowerCase()}`}>
                    {item.type}
                  </span>
                  <span className="item-name">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StoryAnalysisProgress;