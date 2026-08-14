import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrzphrcmkeivjcxchars.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyenBocmNta2VpdmpjeGNoYXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzQ1MTAsImV4cCI6MjEwMjE1MDUxMH0.OAgtg-A28lFK6Fc3x8IdOjucjhcCBAUdY3szvGqG_os';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: clinicas, error: errC } = await supabase.from('clinicas').select('*');
  console.log('Clínicas:', clinicas, errC);

  if (clinicas && clinicas.length > 0) {
    const cid = clinicas[0].id;
    const { data: profs } = await supabase.from('profesionales').select('*').eq('clinica_id', cid);
    console.log('Profesionales:', profs);
  }
}

test();
