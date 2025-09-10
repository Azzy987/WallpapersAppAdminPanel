import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalysisRequest {
  imageUrl: string;
  analysisType?: 'wallpaper' | 'general';
}

interface AnalysisResponse {
  suggestedName: string;
  confidence: number;
  reasoning: string;
  category?: string;
  themes?: string[];
}

serve(async (req) => {
  console.log('AI Image Analysis function started, method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: AnalysisRequest = await req.json()
    console.log('Request body:', body)
    
    const { imageUrl, analysisType = 'wallpaper' } = body

    if (!imageUrl) {
      console.error('imageUrl is missing')
      return new Response(JSON.stringify({ error: 'imageUrl is required' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      })
    }

    console.log('Analyzing image:', imageUrl)

    // Check if OpenAI API key is available
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      console.log('OpenAI API key not found, using fallback analysis')
      // Fallback to advanced pattern analysis
      const fallbackResult = await performFallbackAnalysis(imageUrl)
      return new Response(JSON.stringify(fallbackResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log('Using OpenAI Vision API for image analysis')
    
    // Use OpenAI Vision API for real image analysis
    const analysisResult = await analyzeImageWithOpenAI(imageUrl, openaiApiKey, analysisType)
    
    console.log('Analysis complete:', analysisResult)
    
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (e: any) {
    console.error('AI image analysis error:', e)
    const err = e as Error
    
    // Fallback analysis if AI fails
    try {
      console.log('AI failed, attempting fallback analysis')
      const fallbackResult = await performFallbackAnalysis(req.url)
      return new Response(JSON.stringify(fallbackResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    } catch (fallbackError) {
      console.error('Fallback analysis also failed:', fallbackError)
      return new Response(
        JSON.stringify({ 
          error: 'Analysis failed', 
          details: err.message,
          fallbackError: fallbackError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  }
})

async function analyzeImageWithOpenAI(imageUrl: string, apiKey: string, analysisType: string): Promise<AnalysisResponse> {
  const prompt = analysisType === 'wallpaper' 
    ? `Analyze this wallpaper image and suggest a concise, descriptive name for it. Focus on:
       1. Device type if visible (iPhone, Samsung Galaxy, Google Pixel, etc.)
       2. Main visual theme (Abstract, Nature, Minimal, Dark/AMOLED, Neon, Space, etc.)
       3. Dominant colors or style
       4. Any distinctive features
       
       Provide a name that would be suitable for a wallpaper app catalog. Keep it under 5 words.
       Examples: "iPhone 14 Pro AMOLED", "Abstract Purple Waves", "Nature Mountain Landscape", "Minimal Dark Theme"
       
       Respond with just the suggested name, nothing else.`
    : `Analyze this image and provide a descriptive name for it. Keep it concise and under 5 words.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low' // Use low detail for faster processing
                }
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('OpenAI response:', result)

    const suggestedName = result.choices[0]?.message?.content?.trim() || ''
    
    if (!suggestedName) {
      throw new Error('No content received from OpenAI')
    }

    // Clean up the suggested name
    const cleanName = suggestedName
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\.$/, '') // Remove trailing period
      .trim()

    return {
      suggestedName: cleanName,
      confidence: 0.9, // High confidence for OpenAI
      reasoning: 'Generated using OpenAI Vision API analysis',
      category: analysisType,
      themes: extractThemes(cleanName)
    }

  } catch (error) {
    console.error('OpenAI Vision API error:', error)
    throw error
  }
}

async function performFallbackAnalysis(imageUrl: string): Promise<AnalysisResponse> {
  console.log('Performing fallback analysis for:', imageUrl)
  
  // Extract filename from URL
  const urlParts = imageUrl.split('/')
  const filename = urlParts[urlParts.length - 1]
  
  // Advanced pattern matching for device identification
  const devicePatterns = [
    // Apple patterns - more specific first
    { 
      pattern: /iphone[_\s-]*(\d+)[_\s-]*pro[_\s-]*max/gi, 
      format: (match: string) => match.replace(/iphone[_\s-]*(\d+)[_\s-]*pro[_\s-]*max/gi, 'iPhone $1 Pro Max'),
      confidence: 0.85
    },
    { 
      pattern: /iphone[_\s-]*(\d+)[_\s-]*pro/gi, 
      format: (match: string) => match.replace(/iphone[_\s-]*(\d+)[_\s-]*pro/gi, 'iPhone $1 Pro'),
      confidence: 0.85
    },
    { 
      pattern: /iphone[_\s-]*(\d+)[_\s-]*mini/gi, 
      format: (match: string) => match.replace(/iphone[_\s-]*(\d+)[_\s-]*mini/gi, 'iPhone $1 Mini'),
      confidence: 0.85
    },
    { 
      pattern: /iphone[_\s-]*(\d+)/gi, 
      format: (match: string) => match.replace(/iphone[_\s-]*(\d+)/gi, 'iPhone $1'),
      confidence: 0.8
    },
    
    // Samsung Galaxy patterns
    { 
      pattern: /samsung[_\s-]*galaxy[_\s-]*s(\d+)[_\s-]*ultra/gi, 
      format: (match: string) => match.replace(/samsung[_\s-]*galaxy[_\s-]*s(\d+)[_\s-]*ultra/gi, 'Samsung Galaxy S$1 Ultra'),
      confidence: 0.9
    },
    { 
      pattern: /galaxy[_\s-]*s(\d+)[_\s-]*ultra/gi, 
      format: (match: string) => match.replace(/galaxy[_\s-]*s(\d+)[_\s-]*ultra/gi, 'Samsung Galaxy S$1 Ultra'),
      confidence: 0.85
    },
    { 
      pattern: /samsung[_\s-]*galaxy[_\s-]*s(\d+)/gi, 
      format: (match: string) => match.replace(/samsung[_\s-]*galaxy[_\s-]*s(\d+)/gi, 'Samsung Galaxy S$1'),
      confidence: 0.8
    },
    { 
      pattern: /galaxy[_\s-]*s(\d+)/gi, 
      format: (match: string) => match.replace(/galaxy[_\s-]*s(\d+)/gi, 'Samsung Galaxy S$1'),
      confidence: 0.75
    },
    
    // Google Pixel patterns
    { 
      pattern: /(?:google[_\s-]*)?pixel[_\s-]*(\d+)[_\s-]*pro/gi, 
      format: (match: string) => match.replace(/(?:google[_\s-]*)?pixel[_\s-]*(\d+)[_\s-]*pro/gi, 'Google Pixel $1 Pro'),
      confidence: 0.85
    },
    { 
      pattern: /(?:google[_\s-]*)?pixel[_\s-]*(\d+)/gi, 
      format: (match: string) => match.replace(/(?:google[_\s-]*)?pixel[_\s-]*(\d+)/gi, 'Google Pixel $1'),
      confidence: 0.8
    },
  ]

  // Try to match device patterns
  for (const { pattern, format, confidence } of devicePatterns) {
    const match = filename.match(pattern)
    if (match) {
      let deviceName = format(match[0])
      
      // Add context based on other clues in filename
      const contextKeywords = [
        { patterns: ['amoled', 'dark', 'black'], suffix: 'AMOLED' },
        { patterns: ['4k', 'ultra', 'hd'], suffix: '4K' },
        { patterns: ['minimal', 'clean', 'simple'], suffix: 'Minimal' },
        { patterns: ['abstract', 'art'], suffix: 'Abstract' },
        { patterns: ['nature', 'landscape'], suffix: 'Nature' },
        { patterns: ['neon', 'cyber'], suffix: 'Neon' },
        { patterns: ['space', 'cosmic'], suffix: 'Space' }
      ]
      
      for (const { patterns, suffix } of contextKeywords) {
        if (patterns.some(keyword => filename.toLowerCase().includes(keyword))) {
          deviceName += ` ${suffix}`
          break
        }
      }
      
      return {
        suggestedName: deviceName,
        confidence,
        reasoning: `Device pattern detected: ${match[0]}`,
        category: 'device',
        themes: extractThemes(deviceName)
      }
    }
  }

  // If no device pattern found, try theme-based analysis
  const themePatterns = [
    { pattern: /abstract/gi, name: 'Abstract Art', confidence: 0.7 },
    { pattern: /nature|landscape|mountain|forest|ocean|lake|river/gi, name: 'Nature Landscape', confidence: 0.8 },
    { pattern: /minimal|clean|simple/gi, name: 'Minimal Design', confidence: 0.7 },
    { pattern: /dark|black|amoled/gi, name: 'Dark Theme', confidence: 0.8 },
    { pattern: /neon|cyber|tech|digital/gi, name: 'Neon Tech', confidence: 0.7 },
    { pattern: /space|galaxy|cosmic|nebula|star/gi, name: 'Space Theme', confidence: 0.8 },
    { pattern: /city|urban|building|skyline/gi, name: 'Urban Cityscape', confidence: 0.7 },
    { pattern: /flower|floral|plant|botanical/gi, name: 'Floral Design', confidence: 0.7 },
    { pattern: /geometric|pattern|shapes/gi, name: 'Geometric Pattern', confidence: 0.7 },
    { pattern: /anime|manga|cartoon/gi, name: 'Anime Style', confidence: 0.7 },
    { pattern: /gradient|colorful|rainbow/gi, name: 'Gradient Colors', confidence: 0.6 },
    { pattern: /texture|material|fabric/gi, name: 'Textured Surface', confidence: 0.6 }
  ]

  for (const { pattern, name, confidence } of themePatterns) {
    if (filename.match(pattern)) {
      return {
        suggestedName: name,
        confidence,
        reasoning: `Theme pattern detected in filename`,
        category: 'theme',
        themes: [name.toLowerCase().replace(' ', '_')]
      }
    }
  }

  // Fallback to intelligent filename cleaning
  let name = filename.replace(/\.[^/.]+$/, '') // Remove extension
  name = name.replace(/[_-]+/g, ' ') // Replace separators with spaces
  name = name.replace(/\b\d{3,4}x\d{3,4}\b/g, '') // Remove dimensions
  name = name.replace(/\b\d+[kK]\b/g, '') // Remove resolution markers
  name = name.replace(/\b(wallpaper|bg|background|hd|4k|ultra|ytechb|techb)\b/gi, '') // Remove common terms
  name = name.replace(/\s+/g, ' ').trim() // Clean whitespace
  
  // Capitalize properly
  name = name.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  // If name is too short or empty, create a generic name
  if (!name || name.length < 3) {
    name = 'Custom Wallpaper'
  }

  return {
    suggestedName: name,
    confidence: 0.4, // Low confidence for generic cleaning
    reasoning: 'Generated from filename cleaning',
    category: 'generic',
    themes: extractThemes(name)
  }
}

function extractThemes(name: string): string[] {
  const themes: string[] = []
  const lowerName = name.toLowerCase()
  
  const themeMap = {
    'dark': ['dark', 'black', 'amoled'],
    'minimal': ['minimal', 'clean', 'simple'],
    'nature': ['nature', 'landscape', 'mountain', 'forest', 'ocean'],
    'abstract': ['abstract', 'art'],
    'tech': ['neon', 'cyber', 'tech', 'digital'],
    'space': ['space', 'galaxy', 'cosmic', 'star'],
    'urban': ['city', 'urban', 'building'],
    'device': ['iphone', 'samsung', 'pixel', 'galaxy']
  }
  
  for (const [theme, keywords] of Object.entries(themeMap)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      themes.push(theme)
    }
  }
  
  return themes
}