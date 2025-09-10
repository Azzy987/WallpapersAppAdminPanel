import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.614.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { key } = await req.json()

    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing key' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const region = Deno.env.get('AWS_S3_REGION')
    const bucket = Deno.env.get('AWS_S3_BUCKET')

    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    })

    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key })
    await s3.send(command)

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (e) {
    console.error('s3-delete error:', e)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: (e as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
