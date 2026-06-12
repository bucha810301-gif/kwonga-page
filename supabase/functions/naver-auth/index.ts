import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID')!
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://andongkwon.co.kr'

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return Response.redirect(`${SITE_URL}?error=missing_code`)
  }

  try {
    // 1. 네이버 액세스 토큰 교환
    const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token')
    tokenUrl.searchParams.set('grant_type', 'authorization_code')
    tokenUrl.searchParams.set('client_id', NAVER_CLIENT_ID)
    tokenUrl.searchParams.set('client_secret', NAVER_CLIENT_SECRET)
    tokenUrl.searchParams.set('code', code)
    tokenUrl.searchParams.set('state', 'naver_login')

    const tokenRes = await fetch(tokenUrl.toString())
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      console.error('Naver token error:', JSON.stringify(tokenData))
      return Response.redirect(`${SITE_URL}?error=naver_token_failed`)
    }

    // 2. 네이버 사용자 정보 조회
    const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const userData = await userRes.json()
    const naverUser = userData.response

    if (!naverUser?.email) {
      return Response.redirect(`${SITE_URL}?error=no_email`)
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 3. Supabase 유저 생성 (이미 있으면 무시)
    await supabaseAdmin.auth.admin.createUser({
      email: naverUser.email,
      user_metadata: {
        full_name: naverUser.name ?? naverUser.nickname ?? naverUser.email.split('@')[0],
        provider: 'naver',
        naver_id: naverUser.id,
      },
      app_metadata: { provider: 'naver', providers: ['naver'] },
      email_confirm: true,
    })

    // 4. 매직링크 생성 → 앱으로 리다이렉트
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: naverUser.email,
      options: { redirectTo: SITE_URL },
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('Link error:', linkError)
      return Response.redirect(`${SITE_URL}?error=link_failed`)
    }

    return Response.redirect(linkData.properties.action_link)
  } catch (err) {
    console.error('Naver auth error:', err)
    return Response.redirect(`${SITE_URL}?error=internal_error`)
  }
})
