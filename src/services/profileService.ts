
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UserProfile = {
  id: string;
  name: string;
};

// Global current user state
let currentUser: UserProfile | null = null;

// Initialize by fetching the default user (Bruno Winck)
export const initializeCurrentUser = async (): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (error) {
      console.error("Error fetching default user profile:", error);
      toast.error("Failed to load user profile");
      return null;
    }

    currentUser = {
      id: data.id,
      name: data.name
    };
    
    return currentUser;
  } catch (error) {
    console.error("Error initializing user profile:", error);
    toast.error("Failed to initialize user profile");
    return null;
  }
};

// Get the current user (initialize if not already done)
export const getCurrentUser = async (): Promise<UserProfile | null> => {
  if (!currentUser) {
    return await initializeCurrentUser();
  }
  return currentUser;
};
