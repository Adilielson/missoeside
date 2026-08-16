import { supabase } from "@/integrations/supabase/client";

type AdminActionType = 
  | 'post_create' | 'post_update' | 'post_delete'
  | 'project_create' | 'project_update' | 'project_delete'
  | 'event_create' | 'event_update' | 'event_delete'
  | 'user_create' | 'user_update' | 'user_delete'
  | 'admin_login' | 'admin_access';

interface LogOptions {
  target_id?: string;
  metadata?: Record<string, any>;
}

export async function logAdminAction(
  action: AdminActionType,
  opts: LogOptions = {}
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // First, try to get the user's name from their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();

    const metadata = {
      ...opts.metadata,
      user_id: session.user.id,
      user_name: profile?.full_name || session.user.email,
      target_id: opts.target_id,
    };

    await supabase.from("page_events").insert({
      event_type: "button_click", // Using button_click as a base type for admin actions
      event_name: action,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      metadata: metadata as any,
    });
  } catch (error) {
    console.warn("[admin_logger] failed to log action", error);
  }
}
