import React, { createContext, useContext, useState } from 'react';
import enTranslations from '../translations/en.json';
import hiTranslations from '../translations/hi.json';
import tribalTranslations from '../translations/tribal.json';

const translations = {
  en: enTranslations,
  hi: hiTranslations,
  tribal: tribalTranslations
};

const LanguageContext = createContext();

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const translate = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (language) => {
    if (translations[language]) {
      setCurrentLanguage(language);
      console.log(`Language changed to: ${language}`);
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    translate,
    t: translate // Short alias
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;