import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './src/Local/en.json'; // Import English translations
import translationFR from './src/Local/fr.json'; // Import French translations

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translationEN // Use imported English translations
      },
      fr: {
        translation: translationFR // Use imported French translations
      }
    },
    lng: "fr", // default language
    fallbackLng: "en", // fallback language
    interpolation: {
      escapeValue: false, // react already does escaping
    },
  });

export default i18n;
