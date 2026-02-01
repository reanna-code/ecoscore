// Eleven Labs API service for voice synthesis

const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}

// Default voice settings
const DEFAULT_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true,
};

// Default voice ID (you can change this to any voice ID from Eleven Labs)
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Antoni - a warm, male voice

/**
 * Generate speech audio using Eleven Labs API
 * @param text The text to convert to speech
 * @param apiKey Your Eleven Labs API key
 * @param voiceId Optional voice ID (defaults to Rachel)
 * @param voiceSettings Optional voice settings
 * @returns Audio blob URL
 */
export async function generateSpeech(
  text: string,
  apiKey: string,
  voiceId: string = DEFAULT_VOICE_ID,
  voiceSettings: ElevenLabsVoiceSettings = DEFAULT_VOICE_SETTINGS
): Promise<string> {
  try {
    console.log('📡 Requesting speech from Eleven Labs...');
    console.log('Text length:', text.length);
    
    const response = await fetch(
      `${ELEVEN_LABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail?.message || `Eleven Labs API error: ${response.statusText}`;
      console.error('❌ Eleven Labs API error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        errorData
      });
      throw new Error(errorMessage);
    }

    const audioBlob = await response.blob();
    console.log('✅ Audio blob received, size:', audioBlob.size, 'bytes');
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  } catch (error) {
    console.error('❌ Error generating speech:', error);
    throw error;
  }
}

/**
 * Play audio from a blob URL
 * @param audioUrl The blob URL of the audio
 * @returns Promise that resolves when audio finishes playing
 */
export function playAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    
    // Set volume to ensure it's audible
    audio.volume = 1.0;
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl); // Clean up blob URL
      resolve();
    };
    
    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      URL.revokeObjectURL(audioUrl); // Clean up blob URL
      reject(new Error('Failed to play audio'));
    };
    
    // Handle play promise with better error messages
    audio.play()
      .then(() => {
        console.log('Audio started playing');
      })
      .catch((error) => {
        console.error('Error starting audio playback:', error);
        // Browser autoplay policy might block this
        if (error.name === 'NotAllowedError') {
          reject(new Error('Audio autoplay was blocked by browser. User interaction may be required.'));
        } else {
          reject(error);
        }
      });
  });
}

/**
 * Generate and play speech in one call
 * @param text The text to convert to speech
 * @param apiKey Your Eleven Labs API key
 * @param voiceId Optional voice ID
 * @param voiceSettings Optional voice settings
 */
export async function speakText(
  text: string,
  apiKey: string,
  voiceId?: string,
  voiceSettings?: ElevenLabsVoiceSettings
): Promise<void> {
  const audioUrl = await generateSpeech(text, apiKey, voiceId, voiceSettings);
  await playAudio(audioUrl);
}

/**
 * Get available voices from Eleven Labs
 * @param apiKey Your Eleven Labs API key
 * @returns Array of available voices
 */
export async function getVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  try {
    const response = await fetch(`${ELEVEN_LABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.statusText}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
}
