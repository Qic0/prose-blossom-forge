import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    console.log('Sending password reset email to:', email);

    // Use fetch API to send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "МебельCRM <noreply@yourdomain.com>",
        to: [email],
        subject: "Восстановление пароля - МебельCRM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; font-size: 32px; margin: 0;">МебельCRM</h1>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px;">Восстановление пароля</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
                Здравствуйте!
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
                Мы получили запрос на восстановление пароля для вашего аккаунта <strong>${email}</strong> в системе МебельCRM.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #6366f1; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Восстановить пароль
                </a>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:
              </p>
              
              <p style="color: #6366f1; font-size: 14px; word-break: break-all; margin: 8px 0 24px;">
                ${resetUrl}
              </p>
              
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                  Если вы не запрашивали восстановление пароля, просто игнорируйте это письмо. 
                  Ваш пароль останется без изменений.
                </p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 16px 0;">
                Ссылка для восстановления действительна в течение 1 часа.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px; border-top: 1px solid #e6ebf1;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                С уважением,<br />
                Команда МебельCRM
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const emailResponse = await response.json();
    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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