import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEvent {
  type: string;
  table: string;
  record?: any;
  schema: string;
  old_record?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEvent = await req.json();
    console.log('Auth webhook received:', payload);

    // Проверяем если это событие восстановления пароля
    if (payload.type === 'INSERT' && payload.table === 'auth_audit_log_entries') {
      const record = payload.record;
      
      if (record?.action === 'user_recovery_requested') {
        console.log('Password recovery requested for user:', record.actor_username);
        
        // Здесь вызываем наш кастомный сервис отправки писем
        const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-password-reset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: record.actor_username,
            resetUrl: `https://prose-to-code-bot-28.lovable.app/auth?mode=reset`
          }),
        });

        if (!response.ok) {
          console.error('Failed to send custom password reset email');
        } else {
          console.log('Custom password reset email sent successfully');
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in auth webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);