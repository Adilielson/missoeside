import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const QUOTES = [
  "A persistência é o caminho do êxito.",
  "O sucesso nasce do querer, da determinação e persistência.",
  "Não espere por oportunidades, crie-as.",
  "O melhor modo de prever o futuro é inventá-lo.",
  "Acredite que você pode e você já está no meio do caminho.",
  "Grandes coisas nunca vêm de zonas de conforto.",
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
  "Seja a mudança que você deseja ver no mundo.",
  "Tudo o que um sonho precisa para ser realizado é alguém que acredite que ele possa ser realizado."
];

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    
    const { error } = await supabaseClient
      .from('system_keep_alive')
      .insert([{ message: randomQuote }])

    if (error) throw error

    return new Response(JSON.stringify({ message: "Keep-alive active!", quote: randomQuote }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
