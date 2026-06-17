import { createClient } from '@supabase/supabase-js';

type CreateChallengeBody = {
  userId?: string;
};

type PushTokenRow = {
  token: string;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

function createTwoDigitCode() {
  return Math.floor(Math.random() * 100).toString().padStart(2, '0');
}

async function sendExpoPushNotifications(tokens: string[], challengeId: string, code: string) {
  if (tokens.length === 0) return;

  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title: 'DIBS web unlock request',
    body: `Approve sign-in code ${code}`,
    data: {
      challengeId,
      code,
    },
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push request failed with ${response.status}`);
  }
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse({ error: 'Supabase environment variables are not configured.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing Supabase access token.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateChallengeBody;
  if (!body.userId) {
    return jsonResponse({ error: 'Missing userId.' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid Supabase access token.' }, { status: 401 });
  }

  if (user.id !== body.userId) {
    return jsonResponse({ error: 'Cannot create a challenge for another user.' }, { status: 403 });
  }

  const code = createTwoDigitCode();
  const { data, error } = await supabase
    .from('auth_challenges')
    .insert({
      user_id: user.id,
      code,
      status: 'pending',
    })
    .select('id, code')
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, { status: 500 });
  }

  const { data: pushTokens, error: pushTokenError } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (pushTokenError) {
    return jsonResponse({ id: data.id, code: data.code, pushWarning: pushTokenError.message });
  }

  try {
    await sendExpoPushNotifications(
      ((pushTokens ?? []) as PushTokenRow[]).map((row) => row.token),
      data.id,
      data.code
    );
  } catch (pushError) {
    const message = pushError instanceof Error ? pushError.message : 'Expo push request failed.';
    return jsonResponse({ id: data.id, code: data.code, pushWarning: message });
  }

  return jsonResponse(data);
}
