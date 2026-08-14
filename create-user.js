import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zrzphrcmkeivjcxchars.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyenBocmNta2VpdmpjeGNoYXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NzQ1MTAsImV4cCI6MjEwMjE1MDUxMH0.OAgtg-A28lFK6Fc3x8IdOjucjhcCBAUdY3szvGqG_os";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@gmail.com',
    password: 'password123',
  });
  
  if (error) {
    console.error("SignUp error:", error);
    process.exit(1);
  }
  
  console.log("User created:", data.user?.id);
}

main();
