import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.614.0?target=deno"
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.614.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Function started, method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...')
    const body = await req.json()
    console.log('Request body:', body)
    
    const {
      dir = 'wallpapers',
      filename,
      contentType = 'application/octet-stream',
    } = body

    console.log('Getting environment variables...')
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const region = Deno.env.get('AWS_S3_REGION')
    const bucket = Deno.env.get('AWS_S3_BUCKET')
    const cloudfront = Deno.env.get('CLOUDFRONT_DOMAIN')
    const pattern = Deno.env.get('IMAGE_TRANSFORM_PATTERN') || '/fit-in/{w}x{h}/'

    console.log('Environment variables check:', {
      accessKeyId: accessKeyId ? 'SET' : 'MISSING',
      secretAccessKey: secretAccessKey ? 'SET' : 'MISSING',
      region: region || 'MISSING',
      bucket: bucket || 'MISSING',
      cloudfront: cloudfront || 'MISSING',
      pattern
    })

    if (!accessKeyId) {
      console.error('AWS_ACCESS_KEY_ID is missing')
      return new Response(JSON.stringify({ error: 'AWS_ACCESS_KEY_ID is missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
    if (!secretAccessKey) {
      console.error('AWS_SECRET_ACCESS_KEY is missing')
      return new Response(JSON.stringify({ error: 'AWS_SECRET_ACCESS_KEY is missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
    if (!region) {
      console.error('AWS_S3_REGION is missing')
      return new Response(JSON.stringify({ error: 'AWS_S3_REGION is missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
    if (!bucket) {
      console.error('AWS_S3_BUCKET is missing')
      return new Response(JSON.stringify({ error: 'AWS_S3_BUCKET is missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }
    if (!cloudfront) {
      console.error('CLOUDFRONT_DOMAIN is missing')
      return new Response(JSON.stringify({ error: 'CLOUDFRONT_DOMAIN is missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
    }

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })

    // Generate key
    const cleanDir = String(dir).replace(/^\/+|\/+$/g, '')
    const uuid = crypto.randomUUID()
    const extFromName = filename?.includes('.') ? `.${filename.split('.').pop()}` : ''
    const extFromType = contentType === 'image/png' ? '.png' : contentType === 'image/webp' ? '.webp' : contentType === 'image/jpeg' ? '.jpg' : extFromName || ''
    const key = `${cleanDir}/${uuid}${extFromType}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })

    const publicUrl = `https://${cloudfront}/${key}`
    const thumbnailTemplate = `https://${cloudfront}${pattern}${key}`

    return new Response(
      JSON.stringify({ uploadUrl, key, publicUrl, thumbnailTemplate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (e) {
    console.error('s3-presign-upload error:', e)
    const err = e as Error
    return new Response(
      JSON.stringify({ error: 'Unexpected error', name: err.name, message: err.message, stack: err.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
