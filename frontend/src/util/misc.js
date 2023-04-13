export const getTranslation = (activeLang, key = null) => {
  const defaultLang = activeLang || window.defaultLang;
  const translations = window.translations[defaultLang];
  const text = key
    ? { ...translations.page[key], ...translations.common }
    : translations.common;
  return text;
};
