
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string;
}

interface ProfileContextType {
  currentUser: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const ProfileContext = createContext<ProfileContextType>({
  currentUser: null,
  isLoading: true,
  error: null
});

export const useProfile = () => useContext(ProfileContext);

// Get profile function to fetch user data from Supabase
const getProfile = async (): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      throw new Error("Failed to fetch profile");
    }

    return {
      id: data.id,
      name: data.name
    };
  } catch (error) {
    console.error("Error in getProfile:", error);
    throw error;
  }
};

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setCurrentUser(profile);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ currentUser, isLoading, error }}>
      {children}
    </ProfileContext.Provider>
  );
};
