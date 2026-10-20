"use client";

import { SessionProvider } from "next-auth/react";
import { SoundAndThemeProvider } from "./SoundAndThemeContext";
import { UserProgressProvider } from "./UserProgressContext";
import { LanguageProvider } from "./LanguageContext";
import { KawaiiSenseiBubble } from "./ai-sensei/KawaiiSenseiBubble";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <SoundAndThemeProvider>
          <UserProgressProvider>
            {children}
            <KawaiiSenseiBubble />
          </UserProgressProvider>
        </SoundAndThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}


