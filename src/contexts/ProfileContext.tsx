
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getProfile } from "@/services/profileService";

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
